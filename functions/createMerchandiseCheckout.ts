import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const stripe = await import('npm:stripe@17.13.0').then(m => new m.default(Deno.env.get('STRIPE_SECRET_KEY')));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { items } = body;

    if (!items || items.length === 0) {
      return Response.json({ error: 'No items in cart' }, { status: 400 });
    }

    // Build line items for Stripe
    const lineItems = [];
    for (const item of items) {
      if (!item.price_id) {
        console.error(`No price_id for product: ${item.product_name}`);
        return Response.json({ 
          error: `Product ${item.product_name} is not configured for purchase` 
        }, { status: 400 });
      }

      lineItems.push({
        price: item.price_id,
        quantity: 1
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${Deno.env.get('BASE44_APP_URL')}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('BASE44_APP_URL')}/checkout-cancel`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        type: 'merchandise'
      }
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ 
      error: error.message || 'Failed to create checkout session' 
    }, { status: 500 });
  }
});