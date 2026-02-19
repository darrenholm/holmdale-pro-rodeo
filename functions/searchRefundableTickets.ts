Deno.serve(async (req) => {
  try {
    const { searchType, searchValue } = await req.json();

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

    // Fetch all ticket orders
    const ordersResponse = await fetch('https://rodeo-fresh-production-7348.up.railway.app/api/ticket-orders', {
      headers: { 'Authorization': `Bearer ${railwayToken}` }
    });

    if (!ordersResponse.ok) {
      return Response.json({ error: 'Failed to fetch ticket orders' }, { status: 500 });
    }

    const allOrders = await ordersResponse.json();
    
    // Filter locally based on search type
    let results = [];
    if (searchType === 'code') {
      results = allOrders.filter(order => order.confirmation_code === searchValue);
    } else if (searchType === 'txn') {
      results = allOrders.filter(order => order.moneris_transaction_id === searchValue);
    }

    return Response.json({ results });

  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});