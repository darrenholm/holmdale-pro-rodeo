const RAILWAY_API_URL = 'https://rodeo-fresh-production.up.railway.app';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return Response.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const response = await fetch(`${RAILWAY_API_URL}/api/products/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return Response.json({ error: `Railway API error: ${response.status}` }, { status: response.status });
    }

    const product = await response.json();
    return Response.json({ success: true, data: product });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});