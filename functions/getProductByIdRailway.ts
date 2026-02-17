import { railwayRequest, PUBLIC_ENDPOINTS } from './railwayConfig.js';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return Response.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const product = await railwayRequest(PUBLIC_ENDPOINTS.GET_PRODUCT_BY_ID, {
      params: { id }
    });
    return Response.json({ success: true, data: product });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});