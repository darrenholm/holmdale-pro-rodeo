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

    // Create Monaris payment request
    const monarisPayload = {
      store_id: Deno.env.get('MONARIS_STORE_ID'),
      amount: (total * 100).toFixed(0), // Convert to cents
      currency: 'CAD',
      order_id: `ORDER-${Date.now()}`,
      return_url: `${Deno.env.get('BASE44_APP_URL')}/CheckoutSuccess`,
      cancel_url: `${Deno.env.get('BASE44_APP_URL')}/CheckoutCancel`,
      items: products.map(p => ({
        name: p.name,
        price: p.price,
        quantity: 1
      })),
      shipping_address: shipping_address
    };

    const monarisResponse = await fetch('https://api.monaris.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('MONARIS_API_TOKEN')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(monarisPayload)
    });

    if (!monarisResponse.ok) {
      const errorData = await monarisResponse.text();
      console.error('Monaris API error:', errorData);
      return Response.json({ 
        error: 'Failed to create payment session' 
      }, { status: 500 });
    }

    const monarisData = await monarisResponse.json();

    // Create order record
    await base44.asServiceRole.entities.Order.create({
      monaris_transaction_id: monarisData.transaction_id || monarisData.id,
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
      url: monarisData.checkout_url || monarisData.payment_url 
    });

  } catch (error) {
    console.error('Monaris checkout error:', error);
    return Response.json({ 
      error: error.message || 'Failed to create checkout session' 
    }, { status: 500 });
  }
});