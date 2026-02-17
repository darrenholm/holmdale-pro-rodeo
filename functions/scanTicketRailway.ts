const RAILWAY_API_URL = 'https://rodeo-fresh-production.up.railway.app';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { id, token, scanData } = body;

    if (!id) {
      return Response.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    if (!token) {
      return Response.json({ error: 'Authentication token required' }, { status: 401 });
    }

    const response = await fetch(`${RAILWAY_API_URL}/api/ticket-orders/${id}/scan`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(scanData || {}),
    });

    if (!response.ok) {
      return Response.json({ error: `Railway API error: ${response.status}` }, { status: response.status });
    }

    const result = await response.json();
    return Response.json({ success: true, data: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});