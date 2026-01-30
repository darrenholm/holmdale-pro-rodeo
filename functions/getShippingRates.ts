import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { destination, packages } = body;

    if (!destination || !packages) {
      return Response.json({ error: 'Missing destination or packages' }, { status: 400 });
    }

    // Shiptime API authentication
    const username = Deno.env.get('SHIPTIME_USERNAME');
    const password = Deno.env.get('SHIPTIME_PASSWORD');
    const authString = btoa(`${username}:${password}`);

    // Get shipping rates from Shiptime
    const response = await fetch('https://sandboxapi.shiptime.com/rest/ship/rates', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        origin: {
          postal_code: 'K0A1K0',
          country: 'CA'
        },
        destination: {
          postal_code: destination.postal_code,
          country: destination.country || 'CA'
        },
        packages: packages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Shiptime API error:', errorText);
      return Response.json({ error: 'Failed to get shipping rates' }, { status: response.status });
    }

    const rates = await response.json();
    
    // Extract and sort rates by price (cheapest first)
    const sortedRates = Array.isArray(rates) ? rates.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate)) : [];
    
    return Response.json({ 
      rates: sortedRates,
      shipping_cost: sortedRates.length > 0 ? sortedRates[0].rate : 15
    });
  } catch (error) {
    console.error('Shipping rates error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});