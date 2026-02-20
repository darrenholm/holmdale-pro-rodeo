Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    console.log('Received payload:', payload);
    
    // Login to Railway to get token
    const loginResponse = await fetch('https://rodeo-fresh-production-7348.up.railway.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@holmdale.com',
        password: 'Holmdale2026!'
      })
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      throw new Error(`Login failed: ${loginResponse.status} - ${errorText}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token || loginData.data?.token;
    console.log('Login response:', loginData);
    
    if (!token) {
      throw new Error('No token received from login');
    }
    console.log('Got auth token');
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    // Get all events
    const eventsResponse = await fetch('https://rodeo-fresh-production-7348.up.railway.app/api/events', {
      headers
    });
    
    if (!eventsResponse.ok) {
      throw new Error('Failed to fetch events');
    }
    
    const events = await eventsResponse.json();
    console.log('Found events:', events.length);
    console.log('Event names:', events.map(e => e.name || e.title));
    
    // Update Saturday and Sunday Rodeo prices to $30
    const updates = [];
    for (const event of events) {
      const eventName = event.name || event.title || '';
      console.log('Checking event:', eventName);
      
      if (eventName.includes('Saturday') || eventName.includes('Sunday')) {
        console.log('Updating event:', event.id, eventName);
        
        const updateResponse = await fetch(`https://rodeo-fresh-production-7348.up.railway.app/api/events/${event.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            general_price: 30,
            child_price: 20,
            family_price: 100
          })
        });
        
        if (!updateResponse.ok) {
          console.error('Update failed for', event.id, await updateResponse.text());
        } else {
          const updated = await updateResponse.json();
          console.log('Updated successfully:', event.id);
          updates.push(updated);
        }
      }
    }
    
    return Response.json({ success: true, updated: updates, totalEvents: events.length });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});