Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const token = body.token;
    
    const BASE_URL = 'https://rodeo-fresh-production-7348.up.railway.app';
    
    // Get events
    console.log('Fetching events...');
    const eventsResponse = await fetch(`${BASE_URL}/api/events`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!eventsResponse.ok) {
      throw new Error(`Failed to fetch events: ${eventsResponse.status}`);
    }
    
    const events = await eventsResponse.json();
    console.log(`Found ${events.length} events`);
    
    const updates = [];
    
    for (const event of events) {
      const eventName = event.name || event.title || '';
      console.log(`Event: ${eventName} (ID: ${event.id})`);
      console.log(`Current prices - General: $${event.general_price}, Child: $${event.child_price}, Family: $${event.family_price}`);
      
      if (eventName.includes('Saturday') || eventName.includes('Sunday')) {
        console.log(`Updating ${eventName}...`);
        
        const updateData = {
          general_price: 30,
          child_price: 10,
          family_price: 70
        };
        
        const updateResponse = await fetch(`${BASE_URL}/api/events/${event.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updateData)
        });
        
        if (!updateResponse.ok) {
          console.error(`Failed to update ${eventName}: ${updateResponse.status}`);
          continue;
        }
        
        const updated = await updateResponse.json();
        console.log(`✓ Updated ${eventName} to General: $30, Child: $10, Family: $70`);
        updates.push({ name: eventName, id: event.id, ...updateData });
      }
    }
    
    return Response.json({ 
      success: true, 
      message: `Updated ${updates.length} events`,
      updates 
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});