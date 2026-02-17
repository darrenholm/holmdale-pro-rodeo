import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Skip auth check - staff page uses password protection
        const { rfidTagId, ticketQuantity } = await req.json();

        if (!rfidTagId || !ticketQuantity) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fetch customer name from ticket order
        const allTickets = await base44.asServiceRole.entities.TicketOrder.list();
        const tickets = allTickets.filter(t => 
            t.rfid_wristbands && t.rfid_wristbands.some(w => w.tag_id === rfidTagId)
        );
        const customerName = tickets.length > 0 ? tickets[0].customer_name : 'Bar Customer';

        // Price is $0.07 per ticket including tax
        const totalPrice = ticketQuantity * 0.07;

        // Create Moneris checkout
        const monerisResponse = await fetch('https://gateway.moneris.com/chktv2/request/request.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                store_id: Deno.env.get('MONERIS_STORE_ID'),
                api_token: Deno.env.get('MONERIS_API_TOKEN'),
                checkout_id: Deno.env.get('MONERIS_CHECKOUT_ID'),
                action: 'preload',
                txn_total: totalPrice.toFixed(2),
                order_no: `BAR-${Date.now()}`,
                contact_details: {
                    first_name: customerName || 'Bar Customer',
                },
            }),
        });

        const monerisData = await monerisResponse.json();

        if (monerisData.response?.success === 'true') {
            return Response.json({
                ticket: monerisData.response.ticket,
                totalPrice,
            });
        } else {
            console.error('Moneris error:', monerisData);
            return Response.json({ error: 'Failed to create checkout' }, { status: 500 });
        }
    } catch (error) {
        console.error('Bar ticket checkout error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});