Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { ticket_order_id, refund_amount, reason } = body;

    if (!ticket_order_id || !refund_amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Authenticate with Railway backend
    const loginResponse = await fetch('https://rodeo-fresh-production-7348.up.railway.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'darren@holmgraphics.ca',
        password: 'changeme123'
      })
    });

    if (!loginResponse.ok) {
      return Response.json({ error: 'Authentication failed' }, { status: 500 });
    }

    const authData = await loginResponse.json();
    const railwayToken = authData.token;

    // Get ticket order from Railway
    const ticketResponse = await fetch(`https://rodeo-fresh-production-7348.up.railway.app/api/ticket-orders/${ticket_order_id}`, {
      headers: { 'Authorization': `Bearer ${railwayToken}` }
    });

    if (!ticketResponse.ok) {
      return Response.json({ error: 'Ticket order not found' }, { status: 404 });
    }

    const ticketOrder = await ticketResponse.json();

    console.log('Ticket order:', { 
      id: ticketOrder.id, 
      moneris_id: ticketOrder.moneris_transaction_id, 
      total: ticketOrder.total_price,
      status: ticketOrder.status
    });

    if (refund_amount > Number(ticketOrder.total_price)) {
      return Response.json({ error: 'Refund amount exceeds total price' }, { status: 400 });
    }

    if (!ticketOrder.moneris_transaction_id) {
      console.error('Missing moneris_transaction_id for ticket:', ticket_order_id);
      console.error('Ticket order data:', JSON.stringify(ticketOrder, null, 2));

      // Try to find the transaction ID by confirmation code
      const txnResponse = await fetch(`https://rodeo-fresh-production-7348.up.railway.app/api/ticket-orders/by-confirmation/${ticketOrder.confirmation_code}`, {
        headers: { 'Authorization': `Bearer ${railwayToken}` }
      });

      if (txnResponse.ok) {
        const updatedOrder = await txnResponse.json();
        if (updatedOrder.moneris_transaction_id) {
          ticketOrder.moneris_transaction_id = updatedOrder.moneris_transaction_id;
        }
      }

      if (!ticketOrder.moneris_transaction_id) {
        return Response.json({ 
          error: 'No transaction ID found for this ticket', 
          details: 'Payment may still be processing. Please wait a moment and try again.' 
        }, { status: 400 });
      }
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
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(refundData).toString()
    });

    const refundResult = await monerisResponse.text();
    console.log('Moneris refund response:', refundResult);

    if (!refundResult.includes('<response_code>000000</response_code>')) {
      console.error('Moneris refund failed:', refundResult);
      return Response.json({ error: 'Refund failed with payment processor', details: refundResult }, { status: 500 });
    }

    // Update ticket order in Railway
    const newStatus = refund_amount === ticketOrder.total_price ? 'refunded' : 'cancelled';
    const updateResponse = await fetch(`https://rodeo-fresh-production-7348.up.railway.app/api/ticket-orders/${ticket_order_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${railwayToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: newStatus,
        refund_amount: refund_amount,
        refund_reason: reason || '',
        refunded_at: new Date().toISOString()
      })
    });

    console.log('Refund processed successfully:', ticket_order_id);
    return Response.json({ success: true, message: 'Refund processed successfully', refund_amount: refund_amount });

  } catch (error) {
    console.error('Refund error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});