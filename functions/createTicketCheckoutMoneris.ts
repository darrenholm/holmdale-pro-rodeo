import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { ticketType, quantity, eventId, customerEmail, customerName, customerPhone } = body;

    if (!ticketType || !quantity || !eventId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get event details
    const events = await base44.asServiceRole.entities.Event.filter({ id: eventId });
    const event = events[0];
    if (!event) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    // Calculate price
    const priceKey = ticketType === 'vip' ? 'vip_price' : 'general_price';
    const unitPrice = event[priceKey] || 0;
    const total = unitPrice * parseInt(quantity);

    // Get Moneris credentials
    const storeId = Deno.env.get('MONERIS_STORE_ID');
    const apiToken = Deno.env.get('MONERIS_API_TOKEN');
    const checkoutId = Deno.env.get('MONERIS_CHECKOUT_ID');
    
    if (!storeId || !apiToken || !checkoutId) {
      return Response.json({ error: 'Moneris credentials not configured' }, { status: 500 });
    }

    // Create Moneris Checkout ticket
    const orderId = `TICKET-${Date.now()}`;
    const ticketPayload = {
      store_id: storeId,
      api_token: apiToken,
      checkout_id: checkoutId,
      txn_total: total.toFixed(2),
      environment: 'qa',
      action: 'preload',
      test: true,
      order_no: orderId,
      country: 'CA',
      cust_id: customerEmail || 'guest',
      dynamic_descriptor: 'Holmdale Pro Rodeo Tickets',
      language: 'en',
      cart: {
        items: [{
          url: `${Deno.env.get('BASE44_APP_URL')}/Events`,
          description: `${event.title} - ${ticketType === 'vip' ? 'VIP Box' : 'General Admission'}`,
          product_code: eventId,
          unit_cost: unitPrice.toFixed(2),
          quantity: quantity.toString()
        }]
      },
      contact_details: {
        email: customerEmail || '',
        first_name: customerName?.split(' ')[0] || 'Guest',
        last_name: customerName?.split(' ').slice(1).join(' ') || 'Customer',
        phone: customerPhone || ''
      }
    };

    console.log('Creating Moneris checkout for:', orderId);
    const monerisResponse = await fetch('https://gatewayt.moneris.com/chkt/request/request.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ticketPayload)
    });

    if (!monerisResponse.ok) {
      const errorData = await monerisResponse.text();
      console.error('Moneris ticket error:', errorData);
      return Response.json({ error: 'Failed to create checkout', details: errorData }, { status: 500 });
    }

    const monerisData = await monerisResponse.json();

    if (monerisData.response?.success !== 'true' || !monerisData.response?.ticket) {
      console.error('Moneris error:', monerisData);
      return Response.json({ error: 'Failed to create checkout ticket', details: monerisData }, { status: 500 });
    }

    const checkoutUrl = `https://gatewayt.moneris.com/chkt/display/display.php?ticket=${monerisData.response.ticket}`;

    console.log('Moneris checkout created:', orderId, checkoutUrl);
    return Response.json({ 
      url: checkoutUrl,
      ticket: monerisData.response.ticket,
      order_id: orderId
    });

  } catch (error) {
    console.error('Moneris checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});