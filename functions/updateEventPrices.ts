Deno.serve(async (req) => {
  try {
    const { token } = await req.json();
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    // Get all events
    const eventsResponse = await fetch('https://rodeo-fresh-production-7348.up.railway.app/api/events', {
      headers
    });
    
    const events = await eventsResponse.json();
    
    // Update Saturday and Sunday Rodeo prices to $30
    const updates = [];
    for (const event of events) {
      if (event.name?.includes('Saturday Rodeo') || event.name?.includes('Sunday Rodeo')) {
        const updateResponse = await fetch(`https://rodeo-fresh-production-7348.up.railway.app/api/events/${event.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            general_price: 30,
            child_price: 20,
            family_price: 100
          })
        });
        
        const updated = await updateResponse.json();
        updates.push(updated);
      }
    }
    
    return Response.json({ success: true, updated: updates });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});