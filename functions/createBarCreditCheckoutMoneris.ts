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
    const transactionPayload = {
      store_id: storeId,
      api_token: apiToken,
      purchase: {
        order_id: orderId,
        amount: total_price.toFixed(2),
        crypt_type: '7',
        description: `Bar Credits (${quantity}x at $${price_per_credit} each)`
      }
    };

    console.log('Creating Moneris Gateway transaction for bar credits:', orderId);
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

    // Update bar credit with Moneris transaction ID
    await base44.asServiceRole.entities.BarCredit.update(barCredit.id, {
      monaris_transaction_id: monerisData.receipt.TransID
    });

    console.log('Moneris transaction created for bar credits:', orderId, monerisData);
    return Response.json({ 
      transaction_id: monerisData.receipt.TransID,
      order_id: orderId,
      receipt: monerisData.receipt
    });

  } catch (error) {
    console.error('Moneris bar credit checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});