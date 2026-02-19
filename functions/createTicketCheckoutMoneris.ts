Deno.serve(async (req) => {
    try {
      const body = await req.json();
      const { ticketType, quantity, eventId, customerEmail, customerName, customerPhone } = body;

      if (!ticketType || !quantity || !eventId) {
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

    // Calculate price with HST
    const priceKeyMap = {
      'general': 'general_price',
      'child': 'child_price',
      'family': 'family_price'
    };
    const priceKey = priceKeyMap[ticketType] || 'general_price';
    const unitPrice = event[priceKey] || 0;
    const subtotal = unitPrice * parseInt(quantity);
    const hst = subtotal * 0.13;
    const total = subtotal + hst;

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
      order_no: confirmationCode,
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
    const successUrl = `${appUrl}/checkout-success?confirmation_code=${confirmationCode}`;
    const checkoutUrl = `https://gateway.moneris.com/chkt/index.php?ticket=${result.response.ticket}&redirect=${encodeURIComponent(successUrl)}`;
    
    console.log('Moneris checkout created:', { orderId, confirmationCode, ticket: result.response.ticket, checkoutUrl });
    
    return Response.json({ 
      url: checkoutUrl,
      ticket: result.response.ticket,
      order_id: orderId,
      confirmation_code: confirmationCode
    });

  } catch (error) {
    console.error('Moneris checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});