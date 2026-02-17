import { railwayRequest, PUBLIC_ENDPOINTS } from './railwayConfig.js';

Deno.serve(async (req) => {
  try {
    const events = await railwayRequest(PUBLIC_ENDPOINTS.GET_EVENTS);
    return Response.json({ success: true, data: events });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});