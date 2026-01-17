import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const stripe = await import('npm:stripe@16.4.0').then(m => new m.default(Deno.env.get('STRIPE_SECRET_KEY')));

const priceMap = {
  'general': 'price_1SqhoxDWfF5K6kuQrtzvUPuv'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { ticketType, quantity, eventId, customerEmail, customerName, customerPhone } = body;

    if (!ticketType || !quantity || !eventId) {
      return Response.json(
        { error: 'Missing required fields: ticketType, quantity, eventId' },
        { status: 400 }
      );
    }

    const priceId = priceMap[ticketType];
    if (!priceId) {
      return Response.json(
        { error: 'Invalid ticket type' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: parseInt(quantity)
        }
      ],
      mode: 'payment',
      success_url: `${Deno.env.get('BASE44_APP_URL')}/checkout-success?sessionId={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('BASE44_APP_URL')}/checkout-cancel`,
      customer_email: customerEmail,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        event_id: eventId,
        customer_name: customerName,
        customer_phone: customerPhone,
        ticket_type: ticketType
      }
    });

    return Response.json({ 
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});