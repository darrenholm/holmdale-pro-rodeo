import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { quantity, price_per_credit, customer_info } = body;

    if (!quantity || !price_per_credit || !customer_info) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const total_price = quantity * price_per_credit;
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

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: 'Bar Credits',
            description: `${quantity} bar credits`
          },
          unit_amount: Math.round(price_per_credit * 100)
        },
        quantity: parseInt(quantity)
      }],
      mode: 'payment',
      success_url: `${Deno.env.get('BASE44_APP_URL')}/CheckoutSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('BASE44_APP_URL')}/BuyBarCredits`,
      customer_email: customer_info.email,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        type: 'bar_credit',
        bar_credit_id: barCredit.id,
        confirmation_code: confirmation_code
      }
    });

    // Update bar credit with Stripe session ID
    await base44.asServiceRole.entities.BarCredit.update(barCredit.id, {
      stripe_session_id: session.id
    });

    console.log('Stripe checkout session created:', session.id);
    return Response.json({ url: session.url });

  } catch (error) {
    console.error('Stripe bar credit checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});