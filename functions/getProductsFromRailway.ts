import { railwayRequest, PUBLIC_ENDPOINTS } from './railwayConfig.js';

Deno.serve(async (req) => {
  try {
    const products = await railwayRequest(PUBLIC_ENDPOINTS.GET_PRODUCTS);
    return Response.json({ success: true, data: products });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});