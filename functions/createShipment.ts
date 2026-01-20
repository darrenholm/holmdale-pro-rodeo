import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { order_id, shipping_address, packages, selected_rate } = body;

    if (!order_id || !shipping_address || !packages || !selected_rate) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const username = Deno.env.get('SHIPTIME_USERNAME');
    const password = Deno.env.get('SHIPTIME_PASSWORD');
    const authString = btoa(`${username}:${password}`);

    // Create shipment with Shiptime
    const response = await fetch('https://sandboxapi.shiptime.com/rest/ship/shipments', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        origin: {
          company: 'Holmdale Pro Rodeo',
          postal_code: 'K0A1K0',
          country: 'CA'
        },
        destination: {
          name: shipping_address.name,
          address: shipping_address.line1,
          city: shipping_address.city,
          state: shipping_address.state,
          postal_code: shipping_address.postal_code,
          country: shipping_address.country
        },
        packages: packages,
        service_code: selected_rate.service_code,
        reference: order_id
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Shiptime create shipment error:', errorText);
      return Response.json({ error: 'Failed to create shipment' }, { status: response.status });
    }

    const shipment = await response.json();
    return Response.json({ shipment });
  } catch (error) {
    console.error('Create shipment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});