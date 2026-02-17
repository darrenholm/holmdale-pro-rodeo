const RAILWAY_API_URL = 'https://rodeo-fresh-production.up.railway.app';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return Response.json({ error: 'Confirmation code is required' }, { status: 400 });
    }

    const response = await fetch(`${RAILWAY_API_URL}/api/ticket-orders/confirmation/${code}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return Response.json({ error: `Railway API error: ${response.status}` }, { status: response.status });
    }

    const ticket = await response.json();
    return Response.json({ success: true, data: ticket });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});