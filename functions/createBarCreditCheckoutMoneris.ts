import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { quantity, price_per_credit, customer_info } = body;

    if (!quantity || !price_per_credit || !customer_info) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const subtotal = quantity * price_per_credit;
    const hst = subtotal * 0.13;
    const total_price = subtotal + hst;
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
    const checkoutId = Deno.env.get('MONERIS_CHECKOUT_ID');
    const apiToken = Deno.env.get('MONERIS_API_TOKEN');
    const storeId = Deno.env.get('MONERIS_STORE_ID');

    if (!checkoutId || !apiToken || !storeId) {
      return Response.json({ error: 'Moneris credentials not configured' }, { status: 500 });
    }

    const orderId = `BAR-${Date.now()}`;

    // Create Moneris Checkout ticket
    const checkoutData = {
      store_id: storeId,
      api_token: apiToken,
      checkout_id: checkoutId,
      txn_total: total_price.toFixed(2),
      cart_subtotal: subtotal.toFixed(2),
      tax: {
        amount: hst.toFixed(2),
        description: 'HST',
        rate: '13.00'
      },
      environment: 'prod',
      action: 'preload',
      order_no: orderId,
      cust_id: customer_info.email,
      dynamic_descriptor: 'Bar Credits',
      contact_details: {
        email: customer_info.email,
        first_name: customer_info.name.split(' ')[0] || customer_info.name,
        last_name: customer_info.name.split(' ').slice(1).join(' ') || ''
      }
    };

    console.log('Creating Moneris Checkout for bar credits:', orderId);
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

    const appUrl = Deno.env.get('BASE44_APP_URL') || 'https://holmdalerodeo.base44.app';
    const baseUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;
    const successUrl = `${baseUrl}/BuyBarCredits?code=${confirmation_code}`;
    const checkoutUrl = `https://gateway.moneris.com/chkt/index.php?ticket=${result.response.ticket}&redirect=${encodeURIComponent(successUrl)}`;
    
    // Update bar credit with Moneris ticket
    await base44.asServiceRole.entities.BarCredit.update(barCredit.id, {
      monaris_transaction_id: result.response.ticket
    });

    console.log('Moneris checkout created for bar credits:', { orderId, ticket: result.response.ticket, checkoutUrl });
    return Response.json({ 
      url: checkoutUrl,
      ticket: result.response.ticket,
      order_id: orderId
    });

  } catch (error) {
    console.error('Moneris bar credit checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});