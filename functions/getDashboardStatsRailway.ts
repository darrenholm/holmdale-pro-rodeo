const RAILWAY_API_URL = 'https://rodeo-fresh-production.up.railway.app';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return Response.json({ error: 'Authentication token required' }, { status: 401 });
    }

    const response = await fetch(`${RAILWAY_API_URL}/api/dashboard/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return Response.json({ error: `Railway API error: ${response.status}` }, { status: response.status });
    }

    const stats = await response.json();
    return Response.json({ success: true, data: stats });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});