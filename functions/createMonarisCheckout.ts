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
    const clientId = Deno.env.get('MONERIS_CLIENT_ID');
    const clientSecret = Deno.env.get('MONERIS_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      return Response.json({ 
        error: 'Moneris credentials not configured. Please add MONERIS_CLIENT_ID, MONERIS_CLIENT_SECRET, and MONERIS_MERCHANT_ID in Dashboard > Settings > Environment Variables' 
      }, { status: 500 });
    }

    const tokenResponse = await fetch('https://api.sb.moneris.io/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}&scope=payment.write`
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Moneris OAuth error:', errorData, 'Status:', tokenResponse.status);
      return Response.json({ 
        error: 'Failed to authenticate with Moneris. Please check your Store ID and API Token.',
        details: errorData
      }, { status: 500 });
    }

    const { access_token } = await tokenResponse.json();

    // Create Moneris payment
    const orderId = `ORDER-${Date.now()}`;
    const idempotencyKey = crypto.randomUUID();
    
    const monerisPayload = {
      idempotencyKey: idempotencyKey,
      orderId: orderId,
      amount: {
        amount: Math.round(total * 100).toString(),
        currency: 'CAD'
      },
      paymentMethod: {
        paymentMethodSource: 'CARD',
        card: {
          cardNumber: '4242424242424242',
          expiryMonth: '12',
          expiryYear: '2028',
          cardSecurityCode: '123'
        },
        storePaymentMethod: 'DO_NOT_STORE'
      },
      automaticCapture: 'true',
      ecommerceIndicator: 'ECOMMERCE'
    };

    const merchantId = Deno.env.get('MONERIS_MERCHANT_ID');
    const monerisResponse = await fetch(`https://api.sb.moneris.io/merchants/${merchantId}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'Api-Version': '2024-09-17',
        'X-Merchant-Id': merchantId
      },
      body: JSON.stringify(monerisPayload)
    });

    if (!monerisResponse.ok) {
      const errorData = await monerisResponse.text();
      console.error('Moneris payment error:', errorData, 'Status:', monerisResponse.status);
      return Response.json({ 
        error: 'Failed to process payment',
        details: errorData
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