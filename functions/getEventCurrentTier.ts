Deno.serve(async (req) => {
  try {
    const { eventId } = await req.json();

    if (!eventId) {
      return Response.json({ error: 'eventId required' }, { status: 400 });
    }

    const response = await fetch(`https://rodeo-fresh-production-7348.up.railway.app/api/events/${eventId}/current-tier`);

    if (!response.ok) {
      console.error('Failed to fetch current tier:', response.status, response.statusText);
      return Response.json({ error: 'Failed to fetch tier data' }, { status: 500 });
    }

    const tierData = await response.json();
    console.log('[getEventCurrentTier] Tier data:', tierData);

    return Response.json(tierData);
  } catch (error) {
    console.error('[getEventCurrentTier] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});