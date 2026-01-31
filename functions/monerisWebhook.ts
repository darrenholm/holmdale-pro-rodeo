import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    console.log('Moneris webhook received:', JSON.stringify(body, null, 2));

    // Moneris sends transaction data when payment is successful
    const { order_no, txn_num, response_code } = body;

    // Check if payment was successful (response_code < 50 means approved)
    if (!order_no || !response_code || parseInt(response_code) >= 50) {
      console.log('Payment not approved or missing data');
      return Response.json({ received: true });
    }

    console.log('Processing successful payment for order:', order_no);

    // Handle ticket orders (order_no is now the confirmation code)
    if (order_no.startsWith('CONF-')) {
      const ticketOrders = await base44.asServiceRole.entities.TicketOrder.filter({
        confirmation_code: order_no
      });

      if (ticketOrders.length > 0) {
        const ticketOrder = ticketOrders[0];
        
        // Update ticket order status
        await base44.asServiceRole.entities.TicketOrder.update(ticketOrder.id, {
          status: 'confirmed',
          monaris_transaction_id: txn_num
        });

        console.log('Ticket order confirmed, sending email...');

        // Send confirmation email with QR code
        await base44.asServiceRole.functions.invoke('sendTicketConfirmation', {
          ticket_order_id: ticketOrder.id
        });

        console.log('Ticket confirmation email sent for:', order_no);
      }
    }
    
    // Handle merchandise orders
    else if (order_no.startsWith('ORDER-')) {
      const orders = await base44.asServiceRole.entities.Order.filter({
        monaris_transaction_id: order_no
      });

      if (orders.length > 0) {
        const order = orders[0];
        await base44.asServiceRole.entities.Order.update(order.id, {
          status: 'paid',
          monaris_transaction_id: txn_num
        });

        console.log('Order confirmed:', order_no);
      }
    }
    
    // Handle bar credit orders (order_no is the BAR- transaction ID)
    else if (order_no.startsWith('BAR-')) {
      // Find bar credit by the monaris_transaction_id stored during checkout
      const credits = await base44.asServiceRole.entities.BarCredit.list();
      const matchingCredit = credits.find(c => 
        c.monaris_transaction_id === body.ticket || 
        c.confirmation_code.startsWith('BAR')
      );

      if (matchingCredit) {
        await base44.asServiceRole.entities.BarCredit.update(matchingCredit.id, {
          status: 'confirmed'
        });

        console.log('Bar credit confirmed:', order_no);
      } else {
        console.log('No matching bar credit found for order:', order_no);
      }
    }

    return Response.json({ received: true, processed: true });

  } catch (error) {
    console.error('Moneris webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});