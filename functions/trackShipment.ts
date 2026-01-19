import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { tracking_number } = body;

    if (!tracking_number) {
      return Response.json({ error: 'Missing tracking number' }, { status: 400 });
    }

    const username = Deno.env.get('SHIPTIME_USERNAME');
    const password = Deno.env.get('SHIPTIME_PASSWORD');
    const authString = btoa(`${username}:${password}`);

    // Track shipment via Shiptime
    const response = await fetch(`https://api.shiptime.com/api/tracking/${tracking_number}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Shiptime tracking error:', errorText);
      return Response.json({ error: 'Failed to track shipment' }, { status: response.status });
    }

    const tracking = await response.json();
    return Response.json({ tracking });
  } catch (error) {
    console.error('Track shipment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});