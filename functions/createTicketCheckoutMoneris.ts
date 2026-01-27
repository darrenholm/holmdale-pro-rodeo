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

    if (!storeId || !apiToken) {
      return Response.json({ error: 'Moneris credentials not configured' }, { status: 500 });
    }

    // Create Moneris Gateway transaction
    const orderId = `TICKET-${Date.now()}`;
    const transactionPayload = {
      store_id: storeId,
      api_token: apiToken,
      purchase: {
        order_id: orderId,
        amount: total.toFixed(2),
        crypt_type: '7',
        description: `${event.title} - ${ticketType === 'vip' ? 'VIP Box' : 'General Admission'} (${quantity}x)`
      }
    };

    console.log('Creating Moneris Gateway transaction for:', orderId);
    const monerisResponse = await fetch('https://esqa.moneris.com:443/gateway2/servlet/MpgRequest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transactionPayload)
    });

    if (!monerisResponse.ok) {
      const errorData = await monerisResponse.text();
      console.error('Moneris Gateway error:', errorData);
      return Response.json({ error: 'Failed to create transaction', details: errorData }, { status: 500 });
    }

    const monerisData = await monerisResponse.json();

    if (!monerisData.receipt) {
      console.error('Moneris error:', monerisData);
      return Response.json({ error: 'Failed to process transaction', details: monerisData }, { status: 500 });
    }

    console.log('Moneris transaction created:', orderId, monerisData);
    return Response.json({ 
      transaction_id: monerisData.receipt.TransID,
      order_id: orderId,
      receipt: monerisData.receipt
    });

  } catch (error) {
    console.error('Moneris checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});