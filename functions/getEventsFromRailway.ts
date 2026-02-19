import { railwayRequest } from './railwayConfig.js';

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const token = body.token;
    
    const events = await railwayRequest('/api/events', 'GET', null, token);
    return Response.json({ success: true, data: events });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});