Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { confirmationCode, transactionReference, responseCode } = body;

    if (!confirmationCode || !transactionReference) {
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

    // First, find the ticket by confirmation code
    const searchResponse = await fetch('https://rodeo-fresh-production-7348.up.railway.app/api/ticket-orders', {
      headers: { 'Authorization': `Bearer ${railwayToken}` }
    });

    if (!searchResponse.ok) {
      return Response.json({ error: 'Failed to search tickets' }, { status: 500 });
    }

    const allTickets = await searchResponse.json();
    const ticket = allTickets.find(t => t.confirmation_code === confirmationCode);

    if (!ticket) {
      return Response.json({ error: 'Ticket not found with confirmation code: ' + confirmationCode }, { status: 404 });
    }

    console.log('Found ticket:', ticket.id, 'with confirmation code:', confirmationCode);

    // Update ticket order in Railway using ticket ID
    const updateResponse = await fetch(`https://rodeo-fresh-production-7348.up.railway.app/api/ticket-orders/${ticket.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${railwayToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'confirmed',
        moneris_transaction_id: transactionReference,
        moneris_response_code: responseCode || '000000'
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Failed to update ticket order:', errorText);
      return Response.json({ error: 'Failed to update ticket order', details: errorText }, { status: 500 });
    }

    const updatedTicket = await updateResponse.json();
    console.log('✓ Ticket manually confirmed:', confirmationCode, 'with transaction:', transactionReference);
    
    return Response.json({ 
      success: true, 
      message: 'Ticket confirmed successfully',
      ticket: updatedTicket 
    });

  } catch (error) {
    console.error('Manual confirmation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});