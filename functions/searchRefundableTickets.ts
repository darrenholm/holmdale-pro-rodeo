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
    let results = [];

    if (searchType === 'code') {
      // Search by confirmation code in Railway
      const response = await fetch(`https://rodeo-fresh-production-7348.up.railway.app/api/ticket-orders/search?type=code&value=${encodeURIComponent(searchValue)}`, {
        headers: { 'Authorization': `Bearer ${railwayToken}` }
      });
      
      if (response.ok) {
        results = await response.json();
      }
    } else if (searchType === 'txn') {
      // Search by moneris_transaction_id in Railway
      const response = await fetch(`https://rodeo-fresh-production-7348.up.railway.app/api/ticket-orders/search?type=txn&value=${encodeURIComponent(searchValue)}`, {
        headers: { 'Authorization': `Bearer ${railwayToken}` }
      });
      
      if (response.ok) {
        results = await response.json();
      }
    }

    return Response.json({ results });

  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});