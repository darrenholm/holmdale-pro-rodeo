Deno.serve(async (req) => {
  try {
    const { searchType, searchValue } = await req.json();

    if (!searchValue) {
      return Response.json({ error: 'Search value required' }, { status: 400 });
    }

    const railwayToken = Deno.env.get('RAILWAY_AUTH_TOKEN');
    let results = [];

    if (searchType === 'code') {
      // Search by confirmation code in Railway
      const response = await fetch(`http://localhost:3000/api/ticket-orders/search?type=code&value=${encodeURIComponent(searchValue)}`, {
        headers: { 'Authorization': `Bearer ${railwayToken}` }
      });
      
      if (response.ok) {
        results = await response.json();
      }
    } else if (searchType === 'txn') {
      // Search by moneris_transaction_id in Railway
      const response = await fetch(`http://localhost:3000/api/ticket-orders/search?type=txn&value=${encodeURIComponent(searchValue)}`, {
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