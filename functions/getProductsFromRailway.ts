const RAILWAY_API_URL = 'https://rodeo-fresh-production.up.railway.app';

Deno.serve(async (req) => {
  try {
    const response = await fetch(`${RAILWAY_API_URL}/api/products`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return Response.json({ error: `Railway API error: ${response.status}` }, { status: response.status });
    }

    const products = await response.json();
    return Response.json({ success: true, data: products });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});