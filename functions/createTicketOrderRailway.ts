import { railwayRequest, PUBLIC_ENDPOINTS } from './railwayConfig.js';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const order = await railwayRequest(PUBLIC_ENDPOINTS.CREATE_TICKET_ORDER, {
      method: 'POST',
      body
    });
    return Response.json({ success: true, data: order });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});