import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { quantity, price_per_credit, customer_info } = body;

    if (!quantity || !price_per_credit || !customer_info) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const total_price = quantity * price_per_credit;
    const confirmation_code = `BAR${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create pending bar credit record
    const barCredit = await base44.asServiceRole.entities.BarCredit.create({
      customer_name: customer_info.name,
      customer_email: customer_info.email,
      customer_phone: customer_info.phone || '',
      quantity: quantity,
      remaining_credits: quantity,
      price_per_credit: price_per_credit,
      total_price: total_price,
      status: 'pending',
      confirmation_code: confirmation_code
    });

    // Get Moneris credentials
    const storeId = Deno.env.get('MONERIS_STORE_ID');
    const apiToken = Deno.env.get('MONERIS_API_TOKEN');

    if (!storeId || !apiToken) {
      return Response.json({ error: 'Moneris credentials not configured' }, { status: 500 });
    }

    // Create Moneris Hosted PayPage transaction
    const orderId = `BAR-${Date.now()}`;

    // Build XML request for Hosted PayPage
    const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
    <request>
    <store_id>${storeId}</store_id>
    <api_token>${apiToken}</api_token>
    <hosted_tokenization>
    <order_id>${orderId}</order_id>
    <txn_total>${total_price.toFixed(2)}</txn_total>
    <dynamic_descriptor>Bar Credits</dynamic_descriptor>
    </hosted_tokenization>
    </request>`;

    console.log('Creating Moneris Hosted PayPage for bar credits:', orderId);
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

    // Update bar credit with Moneris ticket
    await base44.asServiceRole.entities.BarCredit.update(barCredit.id, {
      monaris_transaction_id: ticket
    });

    console.log('Moneris hosted page created for bar credits:', { orderId, ticket, hostedUrl });
    return Response.json({ 
      url: hostedUrl,
      ticket: ticket,
      order_id: orderId
    });

  } catch (error) {
    console.error('Moneris bar credit checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});