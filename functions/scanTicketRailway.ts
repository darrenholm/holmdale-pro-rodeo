import { railwayRequest, ADMIN_ENDPOINTS } from './railwayConfig.js';

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

    const result = await railwayRequest(ADMIN_ENDPOINTS.SCAN_TICKET, {
      method: 'PUT',
      token,
      body: scanData || {},
      params: { id }
    });
    return Response.json({ success: true, data: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});