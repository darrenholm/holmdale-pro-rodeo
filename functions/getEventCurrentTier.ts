Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const eventId = body.eventId;
    
    console.log('[getEventCurrentTier] Fetching tier data for event:', eventId);

    if (!eventId) {
      return Response.json({ error: 'eventId required' }, { status: 400 });
    }

    const response = await fetch(`https://rodeo-fresh-production-7348.up.railway.app/api/events/${eventId}/current-tier`);

    console.log('[getEventCurrentTier] Railway response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch current tier:', response.status, errorText);
      return Response.json({ error: 'Failed to fetch tier data', details: errorText }, { status: 500 });
    }

    const tierData = await response.json();
    console.log('[getEventCurrentTier] Tier data:', JSON.stringify(tierData));

    return Response.json(tierData);
  } catch (error) {
    console.error('[getEventCurrentTier] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});