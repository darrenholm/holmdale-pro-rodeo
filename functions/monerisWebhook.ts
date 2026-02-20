import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    console.log('=== MONERIS WEBHOOK RECEIVED ===');
    console.log('Raw request body:', JSON.stringify(body, null, 2));
    console.log('Request headers:', Object.fromEntries(req.headers));
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);

    // Moneris sends transaction data when payment is successful
    const { order_no, txn_num, response_code } = body;

    console.log('Extracted data - order_no:', order_no, 'txn_num:', txn_num, 'response_code:', response_code);

    // Check if payment was successful (response_code < 50 means approved)
    if (!order_no || !response_code || parseInt(response_code) >= 50) {
      console.log('Payment not approved or missing data. Order_no:', order_no, 'Response code:', response_code);
      return Response.json({ received: true });
    }

    console.log('Processing successful payment for order:', order_no);

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
      console.error('Failed to authenticate with Railway');
      return Response.json({ received: true });
    }

    const authData = await loginResponse.json();
    const railwayToken = authData.token;

    // Handle ticket orders (order_no might be confirmation code with or without CONF- prefix)
    if (order_no && (order_no.startsWith('CONF-') || order_no.match(/^[A-Z]{2}-[A-Z0-9]{8}$/))) {
      try {
        console.log('Processing ticket order:', order_no);
        
        // First, find the ticket by confirmation code
        const searchResponse = await fetch('https://rodeo-fresh-production-7348.up.railway.app/api/ticket-orders', {
          headers: { 'Authorization': `Bearer ${railwayToken}` }
        });

        if (!searchResponse.ok) {
          console.error('Failed to fetch ticket orders:', searchResponse.status);
        } else {
          const allTickets = await searchResponse.json();
          const ticket = allTickets.find(t => t.confirmation_code === order_no);

          if (ticket) {
            console.log('Found ticket:', ticket.id, 'for confirmation code:', order_no);
            
            // Update ticket order in Railway using ticket ID
            const updateResponse = await fetch(`https://rodeo-fresh-production-7348.up.railway.app/api/ticket-orders/${ticket.id}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${railwayToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                status: 'confirmed',
                moneris_transaction_id: txn_num,
                moneris_response_code: response_code
              })
            });

            console.log('Railway API response status:', updateResponse.status);
            
            if (updateResponse.ok) {
              const ticketOrder = await updateResponse.json();
              console.log('✓ Ticket order confirmed successfully:', order_no, 'with transaction:', txn_num);
              
              // Send QR code email
              try {
                const emailResponse = await base44.asServiceRole.functions.invoke('resendTicketEmail', {
                  confirmation_code: order_no
                });
                console.log('✓ QR code email sent:', emailResponse);
              } catch (emailError) {
                console.error('✗ Failed to send QR code email:', emailError.message);
              }
            } else {
              const errorText = await updateResponse.text();
              console.error('✗ Failed to update ticket order:', updateResponse.status, errorText);
            }
          } else {
            console.error('Ticket not found with confirmation code:', order_no);
          }
        }
      } catch (error) {
        console.error('Error updating ticket order:', error.message);
      }
    }
    
    // Handle merchandise orders
    else if (order_no.startsWith('ORDER-')) {
      try {
        const updateResponse = await fetch(`https://rodeo-fresh-production-7348.up.railway.app/api/orders/by-confirmation/${order_no}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${railwayToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'paid',
            moneris_transaction_id: txn_num
          })
        });

        if (updateResponse.ok) {
          console.log('Order confirmed:', order_no);
        }
      } catch (error) {
        console.error('Error updating order:', error);
      }
    }
    
    // Handle bar credit orders
    else if (order_no.startsWith('BAR')) {
      try {
        const updateResponse = await fetch(`https://rodeo-fresh-production-7348.up.railway.app/api/bar-credits/by-confirmation/${order_no}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${railwayToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'confirmed',
            moneris_transaction_id: txn_num
          })
        });

        if (updateResponse.ok) {
          console.log('Bar credit confirmed:', order_no);
        }
      } catch (error) {
        console.error('Error updating bar credit:', error);
      }
    }

    return Response.json({ received: true, processed: true });

  } catch (error) {
    console.error('Moneris webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});