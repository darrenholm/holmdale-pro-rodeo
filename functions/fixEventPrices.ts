import { railwayRequest } from './railwayConfig.js';

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const token = body.token;
    
    console.log('Fetching events...');
    const events = await railwayRequest('/api/events', 'GET', null, token);
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
        
        const updated = await railwayRequest(`/api/events/${event.id}`, 'PUT', updateData, token);
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