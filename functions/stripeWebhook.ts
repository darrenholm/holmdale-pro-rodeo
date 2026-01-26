import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import QRCode from 'npm:qrcode@1.5.3';
import { Resend } from 'npm:resend@4.0.0';

const stripe = await import('npm:stripe@17.4.0').then(m => new m.default(Deno.env.get('STRIPE_SECRET_KEY')));
const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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
      
      // Handle ticket orders
      if (session.metadata?.event_id) {
        const eventId = session.metadata.event_id;
        const customerName = session.metadata.customer_name || session.customer_details?.name;
        const customerEmail = session.customer_details?.email;
        
        // Find the ticket order that was created before checkout
        const orders = await base44.asServiceRole.entities.TicketOrder.filter({
          event_id: eventId,
          customer_email: customerEmail,
          status: 'pending'
        });
        
        if (orders.length > 0) {
          const order = orders[0];
          
          // Update order status
          await base44.asServiceRole.entities.TicketOrder.update(order.id, {
            status: 'confirmed'
          });
          
          // Generate QR code as buffer
          const qrCodeBuffer = await QRCode.toBuffer(order.confirmation_code, {
            width: 400,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          
          // Upload QR code to get a URL
          const qrFile = new File([qrCodeBuffer], `ticket-${order.confirmation_code}.png`, { type: 'image/png' });
          const { file_url: qrCodeUrl } = await base44.asServiceRole.integrations.Core.UploadFile({ file: qrFile });
          
          // Get event details
          const event = await base44.asServiceRole.entities.Event.get(eventId);
          
          // Send email with QR code via Resend
          await resend.emails.send({
            from: 'Holmdale Pro Rodeo <onboarding@resend.dev>',
            to: customerEmail,
            subject: `Your Tickets - ${event.title}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #22c55e;">Tickets Confirmed!</h1>
                <p>Hi ${customerName},</p>
                <p>Thank you for purchasing tickets to <strong>${event.title}</strong>!</p>
                
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="margin-top: 0;">Event Details</h2>
                  <p><strong>Date:</strong> ${event.date}</p>
                  <p><strong>Time:</strong> ${event.time}</p>
                  <p><strong>Venue:</strong> ${event.venue || 'Main Arena'}</p>
                </div>
                
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="margin-top: 0;">Your Tickets</h2>
                  <p><strong>Ticket Type:</strong> ${order.ticket_type === 'general' ? 'General Admission' : 'VIP Box'}</p>
                  <p><strong>Quantity:</strong> ${order.quantity}</p>
                  <p><strong>Confirmation Code:</strong> <span style="font-family: monospace; font-size: 18px; color: #22c55e;">${order.confirmation_code}</span></p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <p><strong>Show this QR code at the entrance:</strong></p>
                  <img src="${qrCodeUrl}" alt="Ticket QR Code" style="max-width: 300px;" />
                </div>
                
                <p style="color: #666; font-size: 14px;">
                  Please present this QR code or your confirmation code at the entrance. 
                  We look forward to seeing you at the event!
                </p>
                
                <p>See you at the rodeo!</p>
                <p><strong>Holmdale Pro Rodeo Team</strong></p>
              </div>
            `
          });
          
          console.log('Ticket order confirmed and email sent:', order.confirmation_code);
        }
      }
      // Handle bar credit orders
      else if (session.metadata?.bar_credit_id) {
        const barCreditId = session.metadata.bar_credit_id;
        
        // Update bar credit status to confirmed
        await base44.asServiceRole.entities.BarCredit.update(barCreditId, {
          status: 'confirmed'
        });
        
        // Get bar credit details
        const barCredit = await base44.asServiceRole.entities.BarCredit.get(barCreditId);
        console.log('Bar credit details:', barCredit);
        
        // Generate QR code as buffer
        const qrCodeBuffer = await QRCode.toBuffer(barCredit.confirmation_code, {
          width: 400,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        console.log('QR code generated for:', barCredit.confirmation_code);
        
        // Upload QR code to get a URL
        const qrFile = new File([qrCodeBuffer], `bar-credit-${barCredit.confirmation_code}.png`, { type: 'image/png' });
        const { file_url: qrCodeUrl } = await base44.asServiceRole.integrations.Core.UploadFile({ file: qrFile });
        console.log('QR code uploaded to:', qrCodeUrl);
        
        // Send confirmation email via Resend
        console.log('Sending email to:', barCredit.customer_email);
        const emailResult = await resend.emails.send({
          from: 'Holmdale Pro Rodeo <onboarding@resend.dev>',
          to: barCredit.customer_email,
          subject: 'Your Bar Credits - Ready to Use',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #22c55e;">Bar Credits Confirmed!</h1>
              <p>Hi ${barCredit.customer_name},</p>
              <p>Your bar credits are ready to use!</p>
              
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <h2 style="margin-top: 0;">Your Confirmation Code</h2>
                <p style="font-family: monospace; font-size: 36px; color: #22c55e; font-weight: bold; letter-spacing: 2px;">
                  ${barCredit.confirmation_code}
                </p>
                <p><strong>Credits:</strong> ${barCredit.quantity}</p>
                <p><strong>Value:</strong> $${barCredit.total_price.toFixed(2)}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p><strong>Show this QR code at the bar:</strong></p>
                <img src="${qrCodeUrl}" alt="Bar Credit QR Code" style="max-width: 300px;" />
              </div>
              
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #856404;">
                  <strong>How to use:</strong> Show this QR code or confirmation code at the bar to redeem your credits. 
                  Each credit can be used individually.
                </p>
              </div>
              
              <p>Enjoy your drinks!</p>
              <p><strong>Holmdale Pro Rodeo Team</strong></p>
            </div>
          `
        });
        console.log('Email sent successfully:', emailResult);
        
        console.log('Bar credits confirmed and email sent:', barCredit.confirmation_code);
      }
      // Only process merchandise orders
      else if (session.metadata?.type === 'merchandise') {
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