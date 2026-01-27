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

    // Create Moneris Hosted PayPage transaction
    const orderId = `ORDER-${Date.now()}`;

    // Build XML request for Hosted PayPage
    const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
    <request>
    <store_id>${storeId}</store_id>
    <api_token>${apiToken}</api_token>
    <hosted_tokenization>
    <order_id>${orderId}</order_id>
    <txn_total>${total.toFixed(2)}</txn_total>
    <dynamic_descriptor>Holmdale Shop</dynamic_descriptor>
    </hosted_tokenization>
    </request>`;

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
      return Response.json({ 
        error: 'Failed to create hosted page',
        details: errorData
      }, { status: 500 });
    }

    const xmlResponse = await monerisResponse.text();
    console.log('Moneris response:', xmlResponse);

    // Parse XML response for ticket
    const ticketMatch = xmlResponse.match(/<ticket>(.*?)<\/ticket>/);
    const responseCodeMatch = xmlResponse.match(/<ResponseCode>(.*?)<\/ResponseCode>/);
    const messageMatch = xmlResponse.match(/<Message>(.*?)<\/Message>/);

    const ticket = ticketMatch ? ticketMatch[1] : null;
    const responseCode = responseCodeMatch ? responseCodeMatch[1] : null;
    const message = messageMatch ? messageMatch[1] : null;

    if (!ticket) {
      console.error('Failed to get hosted page ticket:', { responseCode, message, xmlResponse });
      return Response.json({ 
        error: 'Failed to create payment page',
        details: { responseCode, message }
      }, { status: 500 });
    }

    const hostedUrl = `https://esqa.moneris.com/HPPtoken/index.php?id=${ticket}`;

    // Create order record
    await base44.asServiceRole.entities.Order.create({
      monaris_transaction_id: ticket,
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
      url: hostedUrl,
      ticket: ticket,
      order_id: orderId
    });

  } catch (error) {
    console.error('Moneris checkout error:', error);
    return Response.json({ 
      error: error.message || 'Failed to create checkout session' 
    }, { status: 500 });
  }
});