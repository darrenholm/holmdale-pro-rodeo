import { railwayRequest, PUBLIC_ENDPOINTS } from './railwayConfig.js';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return Response.json({ error: 'Confirmation code is required' }, { status: 400 });
    }

    const ticket = await railwayRequest(PUBLIC_ENDPOINTS.GET_TICKET_BY_CONFIRMATION, {
      params: { code }
    });
    return Response.json({ success: true, data: ticket });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});