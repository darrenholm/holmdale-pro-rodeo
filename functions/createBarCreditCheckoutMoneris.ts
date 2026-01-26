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
    const checkoutId = Deno.env.get('MONERIS_CHECKOUT_ID');
    
    if (!storeId || !apiToken || !checkoutId) {
      return Response.json({ error: 'Moneris credentials not configured' }, { status: 500 });
    }

    // Create Moneris Checkout ticket
    const orderId = `BAR-${Date.now()}`;
    const ticketPayload = {
      store_id: storeId,
      api_token: apiToken,
      checkout_id: checkoutId,
      txn_total: total_price.toFixed(2),
      environment: 'qa',
      action: 'preload',
      test: true,
      order_no: orderId,
      country: 'CA',
      cust_id: customer_info.email || 'guest',
      dynamic_descriptor: 'Holmdale Bar Credits',
      language: 'en',
      cart: {
        items: [{
          url: `${Deno.env.get('BASE44_APP_URL')}/BuyBarCredits`,
          description: `Bar Credits (${quantity}x at $${price_per_credit} each)`,
          product_code: 'bar-credits',
          unit_cost: price_per_credit.toFixed(2),
          quantity: quantity.toString()
        }]
      },
      contact_details: {
        email: customer_info.email || '',
        first_name: customer_info.name?.split(' ')[0] || 'Guest',
        last_name: customer_info.name?.split(' ').slice(1).join(' ') || 'Customer',
        phone: customer_info.phone || ''
      }
    };

    console.log('Creating Moneris checkout for bar credits:', orderId);
    const monerisResponse = await fetch('https://gatewayt.moneris.com/chkt/request/request.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ticketPayload)
    });

    if (!monerisResponse.ok) {
      const errorData = await monerisResponse.text();
      console.error('Moneris error:', errorData);
      return Response.json({ error: 'Failed to create checkout', details: errorData }, { status: 500 });
    }

    const monerisData = await monerisResponse.json();

    if (monerisData.response?.success !== 'true' || !monerisData.response?.ticket) {
      console.error('Moneris error:', monerisData);
      return Response.json({ error: 'Failed to create checkout ticket', details: monerisData }, { status: 500 });
    }

    const checkoutUrl = `https://gatewayt.moneris.com/chkt/display/display.php?ticket=${monerisData.response.ticket}`;

    // Update bar credit with Moneris transaction ID
    await base44.asServiceRole.entities.BarCredit.update(barCredit.id, {
      monaris_transaction_id: monerisData.response.ticket
    });

    console.log('Moneris checkout created for bar credits:', orderId, checkoutUrl);
    return Response.json({ 
      url: checkoutUrl,
      ticket: monerisData.response.ticket,
      order_id: orderId
    });

  } catch (error) {
    console.error('Moneris bar credit checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});