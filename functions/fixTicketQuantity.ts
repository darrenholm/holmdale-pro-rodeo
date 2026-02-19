Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { confirmationCode, quantityAdult } = body;

    if (!confirmationCode || quantityAdult === undefined) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Authenticate with Railway backend
    const loginResponse = await fetch('https://rodeo-fresh-production-7348.up.railway.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'darren@holmgraphics.ca',
        password: 'changeme123'
      })
    });

    if (!loginResponse.ok) {
      return Response.json({ error: 'Authentication failed' }, { status: 500 });
    }

    const authData = await loginResponse.json();
    const railwayToken = authData.token;

    // Find the ticket by confirmation code
    const searchResponse = await fetch('https://rodeo-fresh-production-7348.up.railway.app/api/ticket-orders', {
      headers: { 'Authorization': `Bearer ${railwayToken}` }
    });

    if (!searchResponse.ok) {
      return Response.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }

    const allTickets = await searchResponse.json();
    const ticket = allTickets.find(t => t.confirmation_code === confirmationCode);

    if (!ticket) {
      return Response.json({ error: 'Ticket not found: ' + confirmationCode }, { status: 404 });
    }

    console.log('Found ticket:', ticket.id, 'Setting quantityAdult to', quantityAdult);

    // Try PUT request
    const updateResponse = await fetch(`https://rodeo-fresh-production-7348.up.railway.app/api/ticket-orders/${ticket.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${railwayToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...ticket,
        quantityAdult: parseInt(quantityAdult)
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Update failed:', errorText);
      return Response.json({ error: 'Failed to update ticket', details: errorText }, { status: 500 });
    }

    const updatedTicket = await updateResponse.json();
    console.log('✓ Ticket updated:', confirmationCode);
    
    return Response.json({ 
      success: true, 
      message: 'Ticket quantity updated successfully',
      ticket: updatedTicket 
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});