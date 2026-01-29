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
    const checkoutId = Deno.env.get('MONERIS_CHECKOUT_ID');
    const apiToken = Deno.env.get('MONERIS_API_TOKEN');
    const storeId = Deno.env.get('MONERIS_STORE_ID');

    if (!checkoutId || !apiToken || !storeId) {
      return Response.json({ error: 'Moneris credentials not configured' }, { status: 500 });
    }

    const orderId = `TICKET-${Date.now()}`;

    // Create Moneris Checkout ticket
    const checkoutData = {
      store_id: storeId,
      api_token: apiToken,
      checkout_id: checkoutId,
      txn_total: total.toFixed(2),
      environment: 'prod',
      action: 'preload',
      order_no: orderId,
      cust_id: customerEmail,
      dynamic_descriptor: event.title,
      contact_details: {
        email: customerEmail,
        first_name: customerName.split(' ')[0] || customerName,
        last_name: customerName.split(' ').slice(1).join(' ') || ''
      }
    };

    console.log('Creating Moneris Checkout for:', orderId);
    const monerisResponse = await fetch('https://gateway.moneris.com/chkt/request/request.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkoutData)
    });

    if (!monerisResponse.ok) {
      const errorData = await monerisResponse.text();
      console.error('Moneris Checkout error:', errorData);
      return Response.json({ error: 'Failed to create checkout', details: errorData }, { status: 500 });
    }

    const result = await monerisResponse.json();
    console.log('Moneris response:', result);

    if (!result.response || !result.response.success || !result.response.ticket) {
      console.error('Failed to get checkout ticket:', result);
      return Response.json({ 
        error: 'Failed to create payment page', 
        details: result 
      }, { status: 500 });
    }

    const checkoutUrl = `https://gateway.moneris.com/chkt/index.php?ticket=${result.response.ticket}`;
    console.log('Moneris checkout created:', { orderId, ticket: result.response.ticket, checkoutUrl });
    
    return Response.json({ 
      url: checkoutUrl,
      ticket: result.response.ticket,
      order_id: orderId
    });

  } catch (error) {
    console.error('Moneris checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});