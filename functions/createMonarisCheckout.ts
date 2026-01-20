import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { items, shipping_address } = body;

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

    // Calculate total
    const subtotal = products.reduce((sum, p) => sum + p.price, 0);
    const shipping = 5.00; // Basic shipping
    const total = subtotal + shipping;

    // Get Moneris credentials
    const storeId = Deno.env.get('MONERIS_STORE_ID');
    const apiToken = Deno.env.get('MONERIS_API_TOKEN');
    const checkoutId = Deno.env.get('MONERIS_CHECKOUT_ID');
    
    if (!storeId || !apiToken || !checkoutId) {
      return Response.json({ 
        error: 'Moneris credentials not configured' 
      }, { status: 500 });
    }

    // Create Moneris Checkout ticket
    const orderId = `ORDER-${Date.now()}`;
    const ticketPayload = {
      store_id: storeId,
      api_token: apiToken,
      checkout_id: checkoutId,
      txn_total: total.toFixed(2),
      environment: 'qa',
      action: 'preload',
      order_no: orderId,
      cust_id: shipping_address.email || 'guest',
      dynamic_descriptor: 'Holmdale Pro Rodeo',
      language: 'en',
      cart: {
        items: products.map(p => ({
          url: `${Deno.env.get('BASE44_APP_URL')}/Shop`,
          description: p.name,
          product_code: p.id,
          unit_cost: p.price.toFixed(2),
          quantity: '1'
        }))
      },
      contact_details: {
        email: shipping_address.email || '',
        first_name: shipping_address.name?.split(' ')[0] || 'Guest',
        last_name: shipping_address.name?.split(' ').slice(1).join(' ') || 'Customer'
      },
      shipping_details: {
        address_1: shipping_address.address || '',
        city: shipping_address.city || '',
        province: shipping_address.province || '',
        country: shipping_address.country || 'CA',
        postal_code: shipping_address.postal_code || ''
      }
    };

    const monerisResponse = await fetch('https://gatewayt.moneris.com/chkt/request/request.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ticketPayload)
    });

    if (!monerisResponse.ok) {
      const errorData = await monerisResponse.text();
      console.error('Moneris ticket error:', errorData);
      return Response.json({ 
        error: 'Failed to create checkout',
        details: errorData
      }, { status: 500 });
    }

    const monerisData = await monerisResponse.json();

    if (monerisData.response?.success !== 'true' || !monerisData.response?.ticket) {
      console.error('Moneris error:', monerisData);
      return Response.json({ 
        error: 'Failed to create checkout ticket',
        details: monerisData
      }, { status: 500 });
    }

    // Create order record
    await base44.asServiceRole.entities.Order.create({
      monaris_transaction_id: orderId,
      customer_email: shipping_address.email || 'customer@example.com',
      customer_name: shipping_address.name || 'Customer',
      items: products.map(p => ({
        product_id: p.id,
        name: p.name,
        price: p.price
      })),
      total_amount: total,
      shipping_address: shipping_address,
      status: 'pending'
    });

    const checkoutUrl = `https://gatewayt.moneris.com/chkt/display/display.php?ticket=${monerisData.response.ticket}`;

    return Response.json({ 
      url: checkoutUrl,
      ticket: monerisData.response.ticket,
      order_id: orderId
    });

  } catch (error) {
    console.error('Moneris checkout error:', error);
    return Response.json({ 
      error: error.message || 'Failed to create checkout session' 
    }, { status: 500 });
  }
});