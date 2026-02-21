import { railwayRequest, ADMIN_ENDPOINTS } from './railwayConfig.js';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { id, token, scanData } = body;

    console.log('scanTicketRailway called with:', { id, scanData });

    if (!id) {
      return Response.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    if (!token) {
      return Response.json({ error: 'Authentication token required' }, { status: 401 });
    }

    console.log('Sending to Railway endpoint:', ADMIN_ENDPOINTS.SCAN_TICKET);
    console.log('Request body:', scanData);

    const result = await railwayRequest(ADMIN_ENDPOINTS.SCAN_TICKET, {
      method: 'POST',
      token,
      body: scanData || {},
      params: { id }
    });

    console.log('Railway response:', result);
    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('scanTicketRailway error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});