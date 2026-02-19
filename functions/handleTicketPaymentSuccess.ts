import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { confirmation_code } = body;

    if (!confirmation_code) {
      return Response.json({ error: 'Missing confirmation_code' }, { status: 400 });
    }

    console.log('Processing payment success for:', confirmation_code);

    // Find and update the ticket order
    const ticketOrders = await base44.asServiceRole.entities.TicketOrder.filter({
      confirmation_code: confirmation_code
    });

    if (ticketOrders.length === 0) {
      console.log('No ticket order found for:', confirmation_code);
      return Response.json({ error: 'Ticket order not found' }, { status: 404 });
    }

    const ticketOrder = ticketOrders[0];

    // Update status to confirmed
    await base44.asServiceRole.entities.TicketOrder.update(ticketOrder.id, {
      status: 'confirmed'
    });

    // Send confirmation email with QR code
    await base44.asServiceRole.functions.invoke('sendTicketConfirmation', {
      ticket_order_id: ticketOrder.id
    });

    console.log('Ticket confirmation email sent for:', confirmation_code);
    return Response.json({ success: true });

  } catch (error) {
    console.error('Payment success handler error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});