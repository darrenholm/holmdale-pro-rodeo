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

    // Delete event from Railway
    const deleteResponse = await fetch(`https://rodeo-fresh-production-7348.up.railway.app/api/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${railwayToken}`
      }
    });

    if (!deleteResponse.ok) {
      const error = await deleteResponse.text();
      console.error('Failed to delete event:', error);
      return Response.json({ error: 'Failed to delete event' }, { status: 500 });
    }

    return Response.json({ success: true, message: `Event ${eventId} deleted successfully` });

  } catch (error) {
    console.error('Error deleting event:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});