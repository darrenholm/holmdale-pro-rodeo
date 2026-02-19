Deno.serve(async (req) => {
  try {
    const { token, eventId, ...updateData } = await req.json();
    
    // Combine date + time into ISO timestamp if both exist
    if (updateData.date && updateData.time) {
      const dateTimeStr = `${updateData.date}T${updateData.time}:00.000Z`;
      updateData.date = dateTimeStr;
      delete updateData.time;
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    // Delete the old event
    const deleteResponse = await fetch(`https://rodeo-fresh-production-7348.up.railway.app/api/events/${eventId}`, {
      method: 'DELETE',
      headers
    });
    
    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      throw new Error(`Failed to delete event: ${deleteResponse.status} - ${errorText}`);
    }
    
    // Create new event with updated data
    const createResponse = await fetch('https://rodeo-fresh-production-7348.up.railway.app/api/events', {
      method: 'POST',
      headers,
      body: JSON.stringify(updateData)
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create event: ${createResponse.status} - ${errorText}`);
    }
    
    const newEvent = await createResponse.json();
    return Response.json({ success: true, data: newEvent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});