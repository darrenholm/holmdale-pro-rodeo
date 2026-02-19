import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { ticket_order_id, refund_amount, reason } = body;

    if (!ticket_order_id || !refund_amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get ticket order
    const ticketOrder = await base44.asServiceRole.entities.TicketOrder.get(ticket_order_id);
    if (!ticketOrder) {
      return Response.json({ error: 'Ticket order not found' }, { status: 404 });
    }

    if (refund_amount > ticketOrder.total_price) {
      return Response.json({ error: 'Refund amount exceeds total price' }, { status: 400 });
    }

    // Get Moneris credentials
    const storeId = Deno.env.get('MONERIS_STORE_ID');
    const apiToken = Deno.env.get('MONERIS_API_TOKEN');

    if (!storeId || !apiToken) {
      return Response.json({ error: 'Moneris credentials not configured' }, { status: 500 });
    }

    // Create refund request to Moneris
    const refundData = {
      store_id: storeId,
      api_token: apiToken,
      txn_number: ticketOrder.moneris_transaction_id,
      amount: refund_amount.toFixed(2),
      comp_amount: refund_amount.toFixed(2),
      crypt_type: '7',
      type: 'refund'
    };

    console.log('Processing refund for ticket:', ticket_order_id);
    const monerisResponse = await fetch('https://gateway.moneris.com/gateway2/send.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(refundData).toString()
    });

    const refundResult = await monerisResponse.text();
    console.log('Moneris refund response:', refundResult);

    // Parse Moneris response (XML format)
    if (!refundResult.includes('<response_code>000000</response_code>')) {
      console.error('Moneris refund failed:', refundResult);
      return Response.json({ 
        error: 'Refund failed with payment processor',
        details: refundResult 
      }, { status: 500 });
    }

    // Update ticket order status
    const newStatus = refund_amount === ticketOrder.total_price ? 'refunded' : 'cancelled';
    await base44.asServiceRole.entities.TicketOrder.update(ticket_order_id, {
      status: newStatus,
      refund_amount: refund_amount,
      refund_reason: reason || '',
      refunded_at: new Date().toISOString()
    });

    console.log('Refund processed successfully:', ticket_order_id);
    return Response.json({ 
      success: true, 
      message: 'Refund processed successfully',
      refund_amount: refund_amount
    });

  } catch (error) {
    console.error('Refund error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});