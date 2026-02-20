Deno.serve(async (req) => {
  try {
    const { token, eventId, ...updateData } = await req.json();
    
    console.log('Update event request:', { eventId, updateData, hasToken: !!token });
    
    // Combine date + time into ISO timestamp if both exist
    if (updateData.date && updateData.time) {
      const dateTimeStr = `${updateData.date}T${updateData.time}:00.000Z`;
      updateData.date = dateTimeStr;
      delete updateData.time;
    }
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`https://rodeo-fresh-production-7348.up.railway.app/api/events/${eventId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Railway API error:', response.status, errorText);
      throw new Error(`Railway API error: ${response.status} - ${errorText}`);
    }
    
    const event = await response.json();
    console.log('Event updated successfully:', event.id);
    return Response.json({ success: true, data: event });
  } catch (error) {
    console.error('Update event error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});