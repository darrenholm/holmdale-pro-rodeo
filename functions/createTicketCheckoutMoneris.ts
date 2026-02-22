Deno.serve(async (req) => {
    try {
      const body = await req.json();
      const { tickets, barTickets, barCredits, eventId, customerEmail, customerName, customerPhone } = body;

      if (!tickets || !eventId || !customerEmail || !customerName) {
        return Response.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Calculate total quantities and validate
      const totalQuantity = (tickets.general || 0) + (tickets.child || 0) + (tickets.family || 0);
      if (totalQuantity === 0) {
        return Response.json({ error: 'No tickets selected' }, { status: 400 });
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
        console.error('Failed to authenticate with Railway:', loginResponse.status);
        return Response.json({ error: 'Authentication failed' }, { status: 500 });
      }

      const authData = await loginResponse.json();
      const railwayToken = authData.token;

      // Fetch event from Railway to get pricing
      const eventResponse = await fetch('https://rodeo-fresh-production-7348.up.railway.app/api/events', {
        headers: {
          'Authorization': `Bearer ${railwayToken}`
        }
      });

    if (!eventResponse.ok) {
      return Response.json({ error: 'Failed to fetch event data' }, { status: 500 });
    }

    const events = await eventResponse.json();
    const event = events.find(e => e.id === eventId);

    if (!event) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    // Calculate tier pricing from event data
    const ticketsSold = event.tickets_sold || 0;
    let currentTier = 1;
    if (ticketsSold >= event.tier2_quantity) {
      currentTier = 3;
    } else if (ticketsSold >= event.tier1_quantity) {
      currentTier = 2;
    }

    // Calculate prices for each ticket type
    const adultPrice = parseFloat(event[`tier${currentTier}_adult_price`] || '30');
    const childPrice = 10;
    const familyPrice = parseFloat(event[`tier${currentTier}_family_price`] || '70');

    console.log(`Tier ${currentTier} pricing - Adult: $${adultPrice}, Child: $${childPrice}, Family: $${familyPrice}`);

    // Calculate subtotal across all ticket types
    const generalSubtotal = (tickets.general || 0) * adultPrice;
    const childSubtotal = (tickets.child || 0) * childPrice;
    const familySubtotal = (tickets.family || 0) * familyPrice;
    const barTicketsSubtotal = (barTickets || 0) * 7;
    const subtotal = generalSubtotal + childSubtotal + familySubtotal + barTicketsSubtotal;
    const hst = subtotal * 0.13;
    const total = subtotal + hst;

    console.log(`Calculation: General(${tickets.general}×$${adultPrice}=$${generalSubtotal}) + Child(${tickets.child}×$${childPrice}=$${childSubtotal}) + Family(${tickets.family}×$${familyPrice}=$${familySubtotal}) = $${subtotal}, + HST $${hst.toFixed(2)} = $${total.toFixed(2)}`);

    // Get Moneris credentials
    const checkoutId = Deno.env.get('MONERIS_CHECKOUT_ID');
    const apiToken = Deno.env.get('MONERIS_API_TOKEN');
    const storeId = Deno.env.get('MONERIS_STORE_ID');

    console.log('Moneris credentials:', { storeId, checkoutId, apiToken: apiToken?.substring(0, 5) + '...' });

    if (!checkoutId || !apiToken || !storeId) {
      return Response.json({ error: 'Moneris credentials not configured' }, { status: 500 });
    }

    const orderId = `TICKET-${Date.now()}`;
    const confirmationCode = `CONF-${Date.now().toString().slice(-8)}`;

    // Calculate quantity_adult and quantity_child based on all ticket types
    const quantityAdult = (tickets.general || 0) + ((tickets.family || 0) * 2);
    const quantityChild = (tickets.child || 0) + ((tickets.family || 0) * 2);
    
    console.log(`Ticket breakdown: ${quantityAdult} adults, ${quantityChild} children`);

    // Create ticket order in Railway
    console.log('Creating ticket order in Railway:', confirmationCode);
    const createOrderResponse = await fetch('https://rodeo-fresh-production-7348.up.railway.app/api/ticket-orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${railwayToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event_id: eventId,
        ticket_type: 'mixed',
        quantity: totalQuantity,
        quantity_adult: quantityAdult,
        quantity_child: quantityChild,
        tickets: tickets,
        bar_credits: barCredits || 0,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone || '',
        confirmation_code: confirmationCode,
        status: 'pending',
        total_price: total.toFixed(2)
      })
    });

    if (!createOrderResponse.ok) {
      const errorText = await createOrderResponse.text();
      console.error('Failed to create ticket order in Railway:', errorText);
      return Response.json({ error: 'Failed to create ticket order', details: errorText }, { status: 500 });
    }

    const ticketOrderData = await createOrderResponse.json();
    console.log('Ticket order created in Railway:', ticketOrderData);

    // Use the confirmation code that Railway returned (it may generate its own)
    const railwayConfirmationCode = ticketOrderData.confirmation_code || confirmationCode;
    console.log('Using confirmation code from Railway:', railwayConfirmationCode);

    // Create Moneris Checkout ticket
    const checkoutData = {
      store_id: storeId,
      api_token: apiToken,
      checkout_id: checkoutId,
      txn_total: total.toFixed(2),
      cart_subtotal: subtotal.toFixed(2),
      tax: {
        amount: hst.toFixed(2),
        description: 'HST',
        rate: '13.00'
      },
      environment: 'prod',
      action: 'preload',
      order_no: railwayConfirmationCode,
      cust_id: customerEmail,
      contact_details: {
        email: customerEmail,
        first_name: customerName.split(' ')[0] || customerName,
        last_name: customerName.split(' ').slice(1).join(' ') || ''
      }
    };

    console.log('Creating Moneris Checkout for:', orderId);
    console.log('Using production environment');
    console.log('Moneris request data:', JSON.stringify(checkoutData, null, 2));
    const monerisResponse = await fetch('https://gateway.moneris.com/chkt/request/request.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkoutData)
    });

    if (!monerisResponse.ok) {
      const errorData = await monerisResponse.text();
      console.error('Moneris API Error - Status:', monerisResponse.status);
      console.error('Moneris API Error - Response:', errorData);
      console.error('Moneris API Error - Headers:', Object.fromEntries(monerisResponse.headers));
      return Response.json({ 
        error: 'Failed to create checkout', 
        status: monerisResponse.status,
        details: errorData 
      }, { status: 500 });
    }

    const result = await monerisResponse.json();
    console.log('Moneris response:', result);

    if (!result.response || !result.response.success || !result.response.ticket) {
      console.error('Failed to get checkout ticket:', result);
      return Response.json({ 
        error: 'Failed to create payment page', 
        details: result 
      }, { status: 500 });
    }

    const appUrl = Deno.env.get('BASE44_APP_URL') || 'https://holmdalerodeo.app.base44.com';
    const successUrl = `${appUrl}/checkout-success?confirmation_code=${railwayConfirmationCode}&ticket_id=${ticketOrderData.id}`;
    const checkoutUrl = `https://gateway.moneris.com/chkt/index.php?ticket=${result.response.ticket}&redirect=${encodeURIComponent(successUrl)}`;
    
    console.log('Moneris checkout created:', { orderId, confirmationCode: railwayConfirmationCode, ticket: result.response.ticket, checkoutUrl });
    
    const response = { 
      url: checkoutUrl,
      ticket: result.response.ticket,
      order_id: orderId,
      confirmation_code: railwayConfirmationCode
    };
    
    console.log('Returning response:', JSON.stringify(response));
    return Response.json(response);

  } catch (error) {
    console.error('Moneris checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});