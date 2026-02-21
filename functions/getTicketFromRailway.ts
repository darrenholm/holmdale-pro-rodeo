import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { identifier } = await req.json();

    if (!identifier) {
      return Response.json({ error: 'No identifier provided' }, { status: 400 });
    }

    // Get Railway token
    const tokenResponse = await fetch('https://rodeo-fresh-production-7348.up.railway.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'darren@holmgraphics.ca',
        password: 'changeme123'
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Railway authentication failed');
    }

    const tokenData = await tokenResponse.json();
    const railwayToken = tokenData.token || tokenData.data?.token;

    if (!railwayToken) {
      throw new Error('No token from Railway');
    }

    // Query Railway for ticket
    const ticketsResponse = await fetch('https://rodeo-fresh-production-7348.up.railway.app/api/ticket-orders', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${railwayToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!ticketsResponse.ok) {
      throw new Error('Failed to fetch tickets from Railway');
    }

    const allTickets = await ticketsResponse.json();
    const tickets = Array.isArray(allTickets) ? allTickets : allTickets.data || [];

    // Search by confirmation code or RFID
    let foundTicket = null;

    if (identifier.includes('-') || identifier.length < 10) {
      // Likely confirmation code
      foundTicket = tickets.find(t => t.confirmation_code === identifier);
    } else {
      // Likely RFID - search in wristbands
      foundTicket = tickets.find(t => 
        t.rfid_wristbands && 
        Array.isArray(t.rfid_wristbands) &&
        t.rfid_wristbands.some(w => w.tag_id === identifier)
      );
    }

    if (!foundTicket) {
      return Response.json({ 
        success: false,
        message: 'Ticket not found',
        type: 'not_found'
      });
    }

    return Response.json({
      success: true,
      ticket: foundTicket
    });

  } catch (error) {
    console.error('Error fetching ticket:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});