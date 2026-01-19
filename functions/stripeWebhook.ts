import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const stripe = await import('npm:stripe@17.4.0').then(m => new m.default(Deno.env.get('STRIPE_SECRET_KEY')));

Deno.serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    
    // Initialize Base44 client BEFORE Stripe signature validation
    const base44 = createClientFromRequest(req);

    // Validate webhook signature (async in Deno)
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    let event;
    
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Only process merchandise orders
      if (session.metadata?.type === 'merchandise') {
        // Create order record
        const order = await base44.asServiceRole.entities.Order.create({
          stripe_session_id: session.id,
          customer_email: session.customer_details?.email,
          customer_name: session.customer_details?.name,
          total_amount: session.amount_total / 100,
          shipping_address: session.shipping_details?.address,
          status: 'paid'
        });

        console.log('Order created:', order.id);

        // Fetch product details for shipping
        const productIds = session.metadata.product_ids?.split(',') || [];
        const packages = [];
        
        for (const productId of productIds) {
          try {
            const product = await base44.asServiceRole.entities.Product.get(productId);
            if (product) {
              packages.push({
                weight: product.weight || 1,
                weight_unit: 'kg',
                length: product.length || 30,
                width: product.width || 20,
                height: product.height || 5,
                dimension_unit: 'cm'
              });
            }
          } catch (err) {
            console.error('Failed to fetch product:', productId, err);
          }
        }

        // Use default if no packages
        if (packages.length === 0) {
          packages.push({
            weight: 1,
            weight_unit: 'kg',
            length: 30,
            width: 20,
            height: 5,
            dimension_unit: 'cm'
          });
        }

        // Create shipment via Shiptime
        try {
          const shipmentResponse = await base44.asServiceRole.functions.invoke('createShipment', {
            order_id: order.id,
            shipping_address: session.shipping_details?.address,
            packages: packages,
            selected_rate: {
              service_code: 'standard'
            }
          });

          if (shipmentResponse.data?.shipment) {
            // Update order with tracking info
            await base44.asServiceRole.entities.Order.update(order.id, {
              tracking_number: shipmentResponse.data.shipment.tracking_number,
              shipment_id: shipmentResponse.data.shipment.id,
              status: 'shipped'
            });
            console.log('Shipment created:', shipmentResponse.data.shipment.tracking_number);
          }
        } catch (shipmentError) {
          console.error('Failed to create shipment:', shipmentError);
        }
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});