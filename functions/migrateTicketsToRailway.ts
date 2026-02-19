import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Admin-only check
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all tickets from Base44
    const allTickets = await base44.asServiceRole.entities.TicketOrder.list();
    console.log(`Fetched ${allTickets.length} tickets from Base44`);

    // All credentials are managed by Railway environment

    // Prepare data for Railway insert
    const insertedCount = 0;
    const errors = [];

    for (const ticket of allTickets) {
      try {
        // Call Railway function to insert ticket
        const result = await base44.asServiceRole.functions.invoke('insertTicketToRailway', {
          ticket: {
            id: ticket.id,
            event_id: ticket.event_id,
            customer_name: ticket.customer_name,
            customer_email: ticket.customer_email,
            customer_phone: ticket.customer_phone,
            ticket_type: ticket.ticket_type,
            quantityAdult: ticket.quantityAdult,
            quantityChild: ticket.quantityChild,
            total_price: ticket.total_price,
            status: ticket.status,
            confirmation_code: ticket.confirmation_code,
            rfid_wristbands: ticket.rfid_wristbands,
            scanned: ticket.scanned,
            scanned_at: ticket.scanned_at,
            refund_amount: ticket.refund_amount,
            refund_reason: ticket.refund_reason,
            refunded_at: ticket.refunded_at,
            moneris_transaction_id: ticket.moneris_transaction_id,
            created_date: ticket.created_date,
            updated_date: ticket.updated_date,
            created_by: ticket.created_by
          }
        });
        insertedCount++;
      } catch (error) {
        console.error(`Error inserting ticket ${ticket.id}:`, error.message);
        errors.push({ ticket_id: ticket.id, error: error.message });
      }
    }

    return Response.json({ 
      success: true,
      inserted: insertedCount,
      total: allTickets.length,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    console.error('Migration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});