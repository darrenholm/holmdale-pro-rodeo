const RAILWAY_API_URL = 'https://rodeo-fresh-production.up.railway.app';

Deno.serve(async (req) => {
  try {
    const response = await fetch(`${RAILWAY_API_URL}/api/events`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return Response.json({ error: `Railway API error: ${response.status}` }, { status: response.status });
    }

    const events = await response.json();
    return Response.json({ success: true, data: events });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});