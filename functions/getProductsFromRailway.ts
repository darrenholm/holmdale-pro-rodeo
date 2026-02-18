Deno.serve(async (req) => {
  try {
    const response = await fetch('https://rodeo-fresh-production-7348.up.railway.app/api/products');
    
    if (!response.ok) {
      throw new Error(`Railway API error: ${response.status}`);
    }
    
    const products = await response.json();
    return Response.json({ success: true, data: products });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});