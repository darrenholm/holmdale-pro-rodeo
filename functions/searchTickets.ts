Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { searchValue, searchType } = body;

    if (!searchValue) {
      return Response.json({ error: 'Search value required' }, { status: 400 });
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

    // Fetch all tickets from Railway
    const ticketsResponse = await fetch('https://rodeo-fresh-production-7348.up.railway.app/api/ticket-orders', {
      headers: { 'Authorization': `Bearer ${railwayToken}` }
    });

    if (!ticketsResponse.ok) {
      return Response.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }

    const allTickets = await ticketsResponse.json();

    // Filter based on search type
    let results = [];
    if (searchType === 'name') {
      results = allTickets.filter(ticket => 
        ticket.customer_name?.toLowerCase().includes(searchValue.toLowerCase())
      );
    } else if (searchType === 'code') {
      results = allTickets.filter(ticket => 
        ticket.confirmation_code?.toLowerCase().includes(searchValue.toLowerCase())
      );
    } else {
      results = allTickets.filter(ticket => 
        ticket.customer_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
        ticket.confirmation_code?.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    return Response.json({ results });

  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});