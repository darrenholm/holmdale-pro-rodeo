import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { items, customer_info, shipping_address, shipping_cost, shipping_method } = body;

    if (!items || items.length === 0) {
      return Response.json({ error: 'No items in cart' }, { status: 400 });
    }

    // Fetch full product details
    const products = [];
    for (const item of items) {
      const product = await base44.asServiceRole.entities.Product.get(item.product_id);
      if (!product) {
        return Response.json({ error: `Product ${item.product_name} not found` }, { status: 400 });
      }
      products.push(product);
    }

    // Calculate total with HST
    const subtotal = products.reduce((sum, p) => sum + p.price, 0);
    const shipping = shipping_method === 'pickup' ? 0 : (shipping_cost || 15.00);
    const hst = (subtotal + shipping) * 0.13;
    const total = subtotal + hst + shipping;

    // Get Moneris credentials
    const checkoutId = Deno.env.get('MONERIS_CHECKOUT_ID');
    const apiToken = Deno.env.get('MONERIS_API_TOKEN');
    const storeId = Deno.env.get('MONERIS_STORE_ID');

    if (!checkoutId || !apiToken || !storeId) {
      return Response.json({ 
        error: 'Moneris credentials not configured' 
      }, { status: 500 });
    }

    const orderId = `ORDER-${Date.now()}`;
    
    // Get app URL for success redirect
    const appUrl = Deno.env.get('BASE44_APP_URL');
    const successUrl = `${appUrl}/checkout-success`;

    // Create Moneris Checkout ticket
    const checkoutData = {
      store_id: storeId,
      api_token: apiToken,
      checkout_id: checkoutId,
      txn_total: total.toFixed(2),
      cart_subtotal: (subtotal + shipping).toFixed(2),
      tax: {
        amount: hst.toFixed(2),
        description: 'HST',
        rate: '13.00'
      },
      environment: 'prod',
      action: 'preload',
      order_no: orderId,
      cust_id: customer_info?.email || 'customer@example.com',
      dynamic_descriptor: 'Holmdale Shop',
      ask_cvv: 'Y',
      url: successUrl,
      contact_details: {
        email: customer_info?.email || 'customer@example.com',
        first_name: customer_info?.name?.split(' ')[0] || 'Customer',
        last_name: customer_info?.name?.split(' ').slice(1).join(' ') || ''
      }
    };

    console.log('Creating Moneris Checkout for shop:', orderId);
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
      return Response.json({ 
        error: 'Failed to create checkout',
        details: errorData
      }, { status: 500 });
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

    // Create order record
    await base44.asServiceRole.entities.Order.create({
      monaris_transaction_id: result.response.ticket,
      customer_email: customer_info?.email || 'customer@example.com',
      customer_name: customer_info?.name || 'Customer',
      items: products.map(p => ({
        product_id: p.id,
        name: p.name,
        price: p.price
      })),
      total_amount: total,
      shipping_address: shipping_address,
      status: 'pending'
    });

    console.log('Moneris checkout created:', { orderId, ticket: result.response.ticket, checkoutUrl });
    return Response.json({ 
      url: checkoutUrl,
      ticket: result.response.ticket,
      order_id: orderId
    });

  } catch (error) {
    console.error('Moneris checkout error:', error);
    return Response.json({ 
      error: error.message || 'Failed to create checkout session' 
    }, { status: 500 });
  }
});