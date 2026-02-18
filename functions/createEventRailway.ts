Deno.serve(async (req) => {
  try {
    const body = await req.json();
    
    const response = await fetch('https://rodeo-fresh-production-7348.up.railway.app/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Railway API error: ${response.status} - ${errorText}`);
    }
    
    const event = await response.json();
    return Response.json({ success: true, data: event });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});