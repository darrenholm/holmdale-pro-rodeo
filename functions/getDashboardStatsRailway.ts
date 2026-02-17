import { railwayRequest, ADMIN_ENDPOINTS } from './railwayConfig.js';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return Response.json({ error: 'Authentication token required' }, { status: 401 });
    }

    const stats = await railwayRequest(ADMIN_ENDPOINTS.GET_DASHBOARD_STATS, { token });
    return Response.json({ success: true, data: stats });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});