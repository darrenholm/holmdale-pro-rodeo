import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

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
    const shipping = 5.00;

    // Create line items for Stripe
    const lineItems = products.map(p => ({
      price_data: {
        currency: 'cad',
        product_data: {
          name: p.name,
          description: p.description || ''
        },
        unit_amount: Math.round(p.price * 100)
      },
      quantity: 1
    }));

    // Add shipping as line item
    lineItems.push({
      price_data: {
        currency: 'cad',
        product_data: {
          name: 'Shipping'
        },
        unit_amount: Math.round(shipping * 100)
      },
      quantity: 1
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${Deno.env.get('BASE44_APP_URL')}/CheckoutSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('BASE44_APP_URL')}/Shop`,
      customer_email: shipping_address.email || undefined,
      shipping_address_collection: {
        allowed_countries: ['CA', 'US']
      },
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        type: 'merchandise',
        items: JSON.stringify(products.map(p => ({ id: p.id, name: p.name, price: p.price })))
      }
    });

    // Create order record
    await base44.asServiceRole.entities.Order.create({
      stripe_session_id: session.id,
      customer_email: shipping_address.email || 'customer@example.com',
      customer_name: shipping_address.name || 'Customer',
      items: products.map(p => ({
        product_id: p.id,
        name: p.name,
        price: p.price
      })),
      total_amount: subtotal + shipping,
      shipping_address: shipping_address,
      status: 'pending'
    });

    console.log('Stripe checkout session created:', session.id);
    return Response.json({ url: session.url });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ 
      error: error.message || 'Failed to create checkout session' 
    }, { status: 500 });
  }
});