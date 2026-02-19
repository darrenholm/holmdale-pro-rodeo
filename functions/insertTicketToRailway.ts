import sql from 'npm:mssql@10.0.0';

Deno.serve(async (req) => {
  let pool;
  try {
    const { ticket } = await req.json();

    if (!ticket) {
      return Response.json({ error: 'Ticket data required' }, { status: 400 });
    }

    const password = Deno.env.get('SQL_SERVER_PASSWORD');
    if (!password) {
      return Response.json({ error: 'SQL_SERVER_PASSWORD not set in environment' }, { status: 500 });
    }

    // Parse connection string
    const config = {
      server: 'roundhouse.proxy.rlwy.net',
      port: 20151,
      user: 'sa',
      password: password,
      database: 'master',
      authentication: {
        type: 'default'
      },
      options: {
        encrypt: true,
        trustServerCertificate: true
      }
    };

    pool = new sql.ConnectionPool(config);
    await pool.connect();

    const request = pool.request();

    // Insert ticket into Railway
    await request
      .input('id', sql.NVarChar(255), ticket.id)
      .input('event_id', sql.NVarChar(255), ticket.event_id)
      .input('customer_name', sql.NVarChar(255), ticket.customer_name)
      .input('customer_email', sql.NVarChar(255), ticket.customer_email)
      .input('customer_phone', sql.NVarChar(20), ticket.customer_phone)
      .input('ticket_type', sql.NVarChar(50), ticket.ticket_type)
      .input('quantityAdult', sql.Int, ticket.quantityAdult || 0)
      .input('quantityChild', sql.Int, ticket.quantityChild || 0)
      .input('total_price', sql.Decimal(10, 2), ticket.total_price)
      .input('status', sql.NVarChar(50), ticket.status)
      .input('confirmation_code', sql.NVarChar(255), ticket.confirmation_code)
      .input('rfid_wristbands', sql.NVarChar(sql.MAX), JSON.stringify(ticket.rfid_wristbands || []))
      .input('scanned', sql.Bit, ticket.scanned ? 1 : 0)
      .input('scanned_at', sql.DateTime2, ticket.scanned_at)
      .input('refund_amount', sql.Decimal(10, 2), ticket.refund_amount)
      .input('refund_reason', sql.NVarChar(sql.MAX), ticket.refund_reason)
      .input('refunded_at', sql.DateTime2, ticket.refunded_at)
      .input('moneris_transaction_id', sql.NVarChar(255), ticket.moneris_transaction_id)
      .input('created_date', sql.DateTime2, new Date(ticket.created_date))
      .input('updated_date', sql.DateTime2, new Date(ticket.updated_date))
      .input('created_by', sql.NVarChar(255), ticket.created_by)
      .query(`
        INSERT INTO ticket_orders (
          id, event_id, customer_name, customer_email, customer_phone,
          ticket_type, quantityAdult, quantityChild, total_price, status,
          confirmation_code, rfid_wristbands, scanned, scanned_at,
          refund_amount, refund_reason, refunded_at, moneris_transaction_id,
          created_date, updated_date, created_by
        ) VALUES (
          @id, @event_id, @customer_name, @customer_email, @customer_phone,
          @ticket_type, @quantityAdult, @quantityChild, @total_price, @status,
          @confirmation_code, @rfid_wristbands, @scanned, @scanned_at,
          @refund_amount, @refund_reason, @refunded_at, @moneris_transaction_id,
          @created_date, @updated_date, @created_by
        )
      `);

    console.log(`Inserted ticket ${ticket.id} to Railway`);

    return Response.json({ success: true, ticket_id: ticket.id });
  } catch (error) {
    console.error('Insert error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
});