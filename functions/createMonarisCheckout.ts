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

    // Get Moneris OAuth token
    const tokenResponse = await fetch('https://api.sb.moneris.io/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=client_credentials&client_id=${Deno.env.get('MONERIS_STORE_ID')}&client_secret=${Deno.env.get('MONERIS_API_TOKEN')}&scope=payment.write`
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Moneris OAuth error:', errorData);
      return Response.json({ error: 'Failed to authenticate with Moneris' }, { status: 500 });
    }

    const { access_token } = await tokenResponse.json();

    // Create Moneris payment
    const orderId = `ORDER-${Date.now()}`;
    const monerisPayload = {
      order_id: orderId,
      amount: total.toFixed(2),
      currency: 'CAD',
      card: {
        number: '4242424242424242',
        expiry_month: '12',
        expiry_year: '25',
        cvv: '123'
      },
      billing_address: {
        email: shipping_address.email || 'customer@example.com',
        first_name: (shipping_address.name || 'Customer').split(' ')[0],
        last_name: (shipping_address.name || 'Customer').split(' ')[1] || '',
        address_line_1: shipping_address.address_line_1 || '123 Main St',
        city: shipping_address.city || 'Ottawa',
        province: shipping_address.province || 'ON',
        postal_code: shipping_address.postal_code || 'K1A0A1',
        country: shipping_address.country || 'CA'
      }
    };

    const monerisResponse = await fetch(`https://api.sb.moneris.io/merchants/${Deno.env.get('MONERIS_STORE_ID')}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(monerisPayload)
    });

    if (!monerisResponse.ok) {
      const errorData = await monerisResponse.text();
      console.error('Moneris API error:', errorData);
      return Response.json({ 
        error: 'Failed to create payment session' 
      }, { status: 500 });
    }

    const monerisData = await monerisResponse.json();

    // Create order record
    await base44.asServiceRole.entities.Order.create({
      monaris_transaction_id: monerisData.id || orderId,
      customer_email: shipping_address.email || 'customer@example.com',
      customer_name: shipping_address.name || 'Customer',
      items: products.map(p => ({
        product_id: p.id,
        name: p.name,
        price: p.price
      })),
      total_amount: total,
      shipping_address: shipping_address,
      status: monerisData.status === 'approved' ? 'paid' : 'pending'
    });

    return Response.json({ 
      success: true,
      transaction_id: monerisData.id,
      status: monerisData.status,
      redirect_url: `${Deno.env.get('BASE44_APP_URL')}/CheckoutSuccess?transaction_id=${monerisData.id}`
    });

  } catch (error) {
    console.error('Moneris checkout error:', error);
    return Response.json({ 
      error: error.message || 'Failed to create checkout session' 
    }, { status: 500 });
  }
});