import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const stripe = await import('npm:stripe@17.4.0').then(m => new m.default(Deno.env.get('STRIPE_SECRET_KEY')));

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

    // Build line items for Stripe
    const lineItems = [];
    for (const product of products) {
      if (!product.stripe_price_id) {
        console.error(`No price_id for product: ${product.name}`);
        return Response.json({ 
          error: `Product ${product.name} is not configured for purchase` 
        }, { status: 400 });
      }

      lineItems.push({
        price: product.stripe_price_id,
        quantity: 1
      });
    }

    // Get shipping rates from Shiptime if address provided
    let shippingOptions = [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: {
            amount: 500,
            currency: 'cad'
          },
          display_name: 'Standard Shipping',
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 5 },
            maximum: { unit: 'business_day', value: 10 }
          }
        }
      }
    ];

    if (shipping_address?.postal_code) {
      try {
        // Calculate total package dimensions
        const packages = products.map(p => ({
          weight: p.weight || 0.5,
          length: p.length || 30,
          width: p.width || 20,
          height: p.height || 5
        }));

        const ratesResponse = await base44.asServiceRole.functions.invoke('getShippingRates', {
          destination: {
            postal_code: shipping_address.postal_code,
            country: shipping_address.country || 'CA'
          },
          packages
        });

        if (ratesResponse.data?.rates?.length > 0) {
          shippingOptions = ratesResponse.data.rates.slice(0, 3).map(rate => ({
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: {
                amount: Math.round(rate.price * 100),
                currency: 'cad'
              },
              display_name: rate.service_name || 'Shipping',
              delivery_estimate: rate.estimated_delivery ? {
                minimum: { unit: 'business_day', value: rate.estimated_delivery },
                maximum: { unit: 'business_day', value: rate.estimated_delivery + 2 }
              } : undefined
            }
          }));
        }
      } catch (error) {
        console.error('Failed to get Shiptime rates:', error);
      }
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${Deno.env.get('BASE44_APP_URL')}/CheckoutSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('BASE44_APP_URL')}/CheckoutCancel`,
      automatic_tax: { enabled: true },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA']
      },
      shipping_options: shippingOptions,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        type: 'merchandise',
        product_ids: products.map(p => p.id).join(',')
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