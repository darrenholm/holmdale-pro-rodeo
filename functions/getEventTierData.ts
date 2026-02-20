import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { eventId } = body;

    if (!eventId) {
      return Response.json({ error: 'Missing eventId' }, { status: 400 });
    }

    // Authenticate with Railway backend
    const loginResponse = await fetch('https://rodeo-fresh-production-7348.up.railway.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'darren@holmgraphics.ca',
        password: 'changeme123'
      })
    });

    if (!loginResponse.ok) {
      return Response.json({ error: 'Authentication failed' }, { status: 500 });
    }

    const authData = await loginResponse.json();
    const railwayToken = authData.token;

    // Fetch tier data from Railway
    const tierResponse = await fetch(`https://rodeo-fresh-production-7348.up.railway.app/api/events/${eventId}/current-tier`, {
      headers: {
        'Authorization': `Bearer ${railwayToken}`
      }
    });

    if (!tierResponse.ok) {
      const error = await tierResponse.text();
      console.error('Failed to fetch tier data:', error);
      return Response.json({ error: 'Failed to fetch tier data' }, { status: 500 });
    }

    const tierData = await tierResponse.json();
    return Response.json(tierData);

  } catch (error) {
    console.error('Error in getEventTierData:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});