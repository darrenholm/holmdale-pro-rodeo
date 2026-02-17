const RAILWAY_API_URL = 'https://rodeo-fresh-production.up.railway.app';

Deno.serve(async (req) => {
  try {
    const body = await req.json();

    const response = await fetch(`${RAILWAY_API_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return Response.json({ error: `Railway API error: ${response.status}` }, { status: response.status });
    }

    const order = await response.json();
    return Response.json({ success: true, data: order });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});