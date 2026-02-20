import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { tier1_sold } = body;

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

    // Update event
    const updateResponse = await fetch('https://rodeo-fresh-production-7348.up.railway.app/api/events/696bb80b79d792d4580e5de7', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${railwayToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tier1_sold })
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      console.error('Failed to update event:', error);
      return Response.json({ error: 'Failed to update event' }, { status: 500 });
    }

    const result = await updateResponse.json();
    return Response.json({ success: true, data: result });

  } catch (error) {
    console.error('Error updating event:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});