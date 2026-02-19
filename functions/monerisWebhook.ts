Deno.serve(async (req) => {
  try {
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

    // Handle ticket orders (order_no is the CONF- prefixed confirmation code)
    if (order_no.startsWith('CONF-')) {
      try {
        // Update ticket order in Railway
        const updateResponse = await fetch(`https://rodeo-fresh-production-7348.up.railway.app/api/ticket-orders/by-confirmation/${order_no}`, {
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
          const ticketOrder = await updateResponse.json();
          console.log('Ticket order confirmed:', order_no);

          // Send confirmation email
          // You can call sendTicketConfirmation function or invoke it via API
        }
      } catch (error) {
        console.error('Error updating ticket order:', error);
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