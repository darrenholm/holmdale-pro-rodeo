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
    console.log('Full event data:', JSON.stringify(events, null, 2));
    
    const updates = [];
    
    for (const event of events) {
      const eventName = event.name || event.title || '';
      console.log(`\nProcessing event: ${eventName} (ID: ${event.id})`);
      console.log(`Current event data:`, JSON.stringify(event, null, 2));
      
      if (eventName.includes('Saturday') || eventName.includes('Sunday')) {
        console.log(`Updating ${eventName}...`);
        
        // Send ALL existing fields plus the price updates
        const updateData = {
          ...event,
          general_price: 30,
          child_price: 10,
          family_price: 70
        };
        
        // Remove fields that shouldn't be updated
        delete updateData.id;
        delete updateData.created_at;
        delete updateData.updated_at;
        
        console.log('Sending update data:', JSON.stringify(updateData, null, 2));
        
        const updateResponse = await fetch(`${BASE_URL}/api/events/${event.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updateData)
        });
        
        const responseText = await updateResponse.text();
        console.log(`Update response status: ${updateResponse.status}`);
        console.log(`Update response body: ${responseText}`);
        
        if (!updateResponse.ok) {
          console.error(`Failed to update ${eventName}: ${updateResponse.status} - ${responseText}`);
          continue;
        }
        
        console.log(`✓ Updated ${eventName}`);
        updates.push({ name: eventName, id: event.id, general_price: 30, child_price: 10, family_price: 70 });
      }
    }
    
    return Response.json({ 
      success: true, 
      message: `Updated ${updates.length} events`,
      updates 
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});