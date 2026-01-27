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

    if (!storeId || !apiToken) {
      return Response.json({ 
        error: 'Moneris credentials not configured' 
      }, { status: 500 });
    }

    // Create Moneris Gateway transaction
    const orderId = `ORDER-${Date.now()}`;
    const transactionPayload = {
      store_id: storeId,
      api_token: apiToken,
      purchase: {
        order_id: orderId,
        amount: total.toFixed(2),
        crypt_type: '7',
        description: `Order: ${products.map(p => p.name).join(', ')}`
      }
    };

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
      return Response.json({ 
        error: 'Failed to create transaction',
        details: errorData
      }, { status: 500 });
    }

    const monerisData = await monerisResponse.json();

    if (!monerisData.receipt) {
      console.error('Moneris error:', monerisData);
      return Response.json({ 
        error: 'Failed to process transaction',
        details: monerisData
      }, { status: 500 });
    }

    // Create order record
    await base44.asServiceRole.entities.Order.create({
      monaris_transaction_id: monerisData.receipt.TransID,
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

    return Response.json({ 
      transaction_id: monerisData.receipt.TransID,
      order_id: orderId,
      receipt: monerisData.receipt
    });

  } catch (error) {
    console.error('Moneris checkout error:', error);
    return Response.json({ 
      error: error.message || 'Failed to create checkout session' 
    }, { status: 500 });
  }
});