import sql from 'npm:mssql@10.0.0';

Deno.serve(async (req) => {
  let pool;
  try {
    const body = await req.json();
    const { ticket_order_id, refund_amount, reason } = body;

    if (!ticket_order_id || !refund_amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const password = Deno.env.get('SQL_SERVER_PASSWORD');
    if (!password) {
      return Response.json({ error: 'SQL_SERVER_PASSWORD not set in environment' }, { status: 500 });
    }

    const config = {
      server: 'roundhouse.proxy.rlwy.net',
      port: 20151,
      user: 'sa',
      password: password,
      database: 'master',
      authentication: { type: 'default' },
      options: { encrypt: true, trustServerCertificate: true }
    };

    pool = new sql.ConnectionPool(config);
    await pool.connect();

    // Get ticket order from Railway
    const ticketResult = await pool.request()
      .input('id', sql.NVarChar(255), ticket_order_id)
      .query('SELECT * FROM ticket_orders WHERE id = @id');

    const ticketOrder = ticketResult.recordset?.[0];
    if (!ticketOrder) {
      return Response.json({ error: 'Ticket order not found' }, { status: 404 });
    }

    console.log('Ticket order:', { id: ticketOrder.id, moneris_id: ticketOrder.moneris_transaction_id, total: ticketOrder.total_price });

    if (refund_amount > ticketOrder.total_price) {
      return Response.json({ error: 'Refund amount exceeds total price' }, { status: 400 });
    }

    if (!ticketOrder.moneris_transaction_id) {
      return Response.json({ error: 'No transaction ID found for this ticket' }, { status: 400 });
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

    // Update ticket in Railway
    const newStatus = refund_amount === ticketOrder.total_price ? 'refunded' : 'cancelled';
    await pool.request()
      .input('id', sql.NVarChar(255), ticket_order_id)
      .input('status', sql.NVarChar(50), newStatus)
      .input('refund_amount', sql.Decimal(10, 2), refund_amount)
      .input('refund_reason', sql.NVarChar(sql.MAX), reason || '')
      .input('refunded_at', sql.DateTime2, new Date())
      .query(`
        UPDATE ticket_orders 
        SET status = @status, refund_amount = @refund_amount, refund_reason = @refund_reason, refunded_at = @refunded_at
        WHERE id = @id
      `);

    console.log('Refund processed successfully:', ticket_order_id);
    return Response.json({ success: true, message: 'Refund processed successfully', refund_amount: refund_amount });

  } catch (error) {
    console.error('Refund error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  } finally {
    if (pool) await pool.close();
  }
});