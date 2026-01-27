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

    // Create Moneris Hosted PayPage transaction
    const orderId = `TICKET-${Date.now()}`;

    // Build XML request for Hosted PayPage
    const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
    <request>
    <store_id>${storeId}</store_id>
    <api_token>${apiToken}</api_token>
    <hosted_tokenization>
    <order_id>${orderId}</order_id>
    <txn_total>${total.toFixed(2)}</txn_total>
    <dynamic_descriptor>${event.title}</dynamic_descriptor>
    </hosted_tokenization>
    </request>`;

    console.log('Creating Moneris Hosted PayPage for:', orderId);
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
      return Response.json({ error: 'Failed to create hosted page', details: errorData }, { status: 500 });
    }

    const xmlResponse = await monerisResponse.text();
    console.log('Moneris response:', xmlResponse);

    // Parse XML response for ticket
    const ticketMatch = xmlResponse.match(/<ticket>(.*?)<\/ticket>/);
    const responseCodeMatch = xmlResponse.match(/<ResponseCode>(.*?)<\/ResponseCode>/);
    const messageMatch = xmlResponse.match(/<Message>(.*?)<\/Message>/);

    const ticket = ticketMatch ? ticketMatch[1] : null;
    const responseCode = responseCodeMatch ? responseCodeMatch[1] : null;
    const message = messageMatch ? messageMatch[1] : null;

    if (!ticket) {
      console.error('Failed to get hosted page ticket:', { responseCode, message, xmlResponse });
      return Response.json({ 
        error: 'Failed to create payment page', 
        details: { responseCode, message } 
      }, { status: 500 });
    }

    const hostedUrl = `https://esqa.moneris.com/HPPtoken/index.php?id=${ticket}`;
    console.log('Moneris hosted page created:', { orderId, ticket, hostedUrl });

    return Response.json({ 
      url: hostedUrl,
      ticket: ticket,
      order_id: orderId
    });

  } catch (error) {
    console.error('Moneris checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});