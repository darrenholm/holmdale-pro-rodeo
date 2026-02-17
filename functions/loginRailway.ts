const RAILWAY_API_URL = 'https://rodeo-fresh-production.up.railway.app';

Deno.serve(async (req) => {
  try {
    const body = await req.json();

    const response = await fetch(`${RAILWAY_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return Response.json({ error: `Login failed: ${response.status}` }, { status: response.status });
    }

    const result = await response.json();
    return Response.json({ success: true, data: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});