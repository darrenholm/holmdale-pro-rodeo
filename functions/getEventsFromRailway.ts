Deno.serve(async (req) => {
  try {
    const response = await fetch('https://rodeo-fresh-production-7348.up.railway.app/api/events');
    
    if (!response.ok) {
      throw new Error(`Railway API error: ${response.status}`);
    }
    
    const events = await response.json();
    return Response.json({ success: true, data: events });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});