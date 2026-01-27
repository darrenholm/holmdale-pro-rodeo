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

    // Create Moneris Gateway transaction
    const orderId = `BAR-${Date.now()}`;

    // Build XML request for Moneris Gateway API
    const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
    <request>
    <store_id>${storeId}</store_id>
    <api_token>${apiToken}</api_token>
    <purchase>
    <order_id>${orderId}</order_id>
    <amount>${total_price.toFixed(2)}</amount>
    <pan>4242424242424242</pan>
    <expdate>2512</expdate>
    <crypt_type>7</crypt_type>
    <dynamic_descriptor>Bar Credits</dynamic_descriptor>
    </purchase>
    </request>`;

    console.log('Creating Moneris Gateway transaction for bar credits:', orderId);
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

    // Update bar credit with Moneris transaction ID
    await base44.asServiceRole.entities.BarCredit.update(barCredit.id, {
      monaris_transaction_id: transId
    });

    console.log('Moneris transaction successful:', { orderId, receiptId, transId });
    return Response.json({ 
      transaction_id: transId,
      receipt_id: receiptId,
      order_id: orderId,
      message: message
    });

  } catch (error) {
    console.error('Moneris bar credit checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});