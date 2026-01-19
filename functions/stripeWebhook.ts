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

        // Prepare packages for shipping (assuming standard 1lb package per item)
        const packages = [{
          weight: 1,
          weight_unit: 'lb',
          length: 12,
          width: 10,
          height: 3,
          dimension_unit: 'in'
        }];

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