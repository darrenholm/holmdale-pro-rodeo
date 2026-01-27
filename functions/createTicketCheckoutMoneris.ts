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

    // Build XML request for Moneris Gateway API
    const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
    <request>
    <store_id>${storeId}</store_id>
    <api_token>${apiToken}</api_token>
    <purchase>
    <order_id>${orderId}</order_id>
    <amount>${total.toFixed(2)}</amount>
    <pan>4242424242424242</pan>
    <expdate>2512</expdate>
    <crypt_type>7</crypt_type>
    <dynamic_descriptor>${event.title}</dynamic_descriptor>
    </purchase>
    </request>`;

    console.log('Creating Moneris Gateway transaction for:', orderId);
    const monerisResponse = await fetch('https://esqa.moneris.com:443/gateway2/servlet/MpgRequest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml'
      },
      body: xmlRequest
    });

    if (!monerisResponse.ok) {
      const errorData = await monerisResponse.text();
      console.error('Moneris Gateway error:', errorData);
      return Response.json({ error: 'Failed to create transaction', details: errorData }, { status: 500 });
    }

    const xmlResponse = await monerisResponse.text();
    console.log('Moneris response:', xmlResponse);

    // Parse XML response
    const receiptCodeMatch = xmlResponse.match(/<ReceiptId>(.*?)<\/ReceiptId>/);
    const responseCodeMatch = xmlResponse.match(/<ResponseCode>(.*?)<\/ResponseCode>/);
    const messageMatch = xmlResponse.match(/<Message>(.*?)<\/Message>/);
    const transIdMatch = xmlResponse.match(/<TransID>(.*?)<\/TransID>/);

    const receiptId = receiptCodeMatch ? receiptCodeMatch[1] : null;
    const responseCode = responseCodeMatch ? responseCodeMatch[1] : null;
    const message = messageMatch ? messageMatch[1] : null;
    const transId = transIdMatch ? transIdMatch[1] : null;

    if (!receiptId || parseInt(responseCode) >= 50) {
      console.error('Moneris transaction failed:', { responseCode, message });
      return Response.json({ 
        error: 'Payment failed', 
        details: { responseCode, message } 
      }, { status: 500 });
    }

    console.log('Moneris transaction successful:', { orderId, receiptId, transId });
    return Response.json({ 
      transaction_id: transId,
      receipt_id: receiptId,
      order_id: orderId,
      message: message
    });

  } catch (error) {
    console.error('Moneris checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});