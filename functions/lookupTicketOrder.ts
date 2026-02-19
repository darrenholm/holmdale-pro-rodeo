Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { confirmationCode } = body;

    if (!confirmationCode) {
      return Response.json({ error: 'Confirmation code required' }, { status: 400 });
    }

    // Authenticate with Railway
    const loginResponse = await fetch('https://rodeo-fresh-production-7348.up.railway.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'darren@holmgraphics.ca',
        password: 'changeme123'
      })
    });

    if (!loginResponse.ok) {
      return Response.json({ error: 'Failed to authenticate with Railway' }, { status: 500 });
    }

    const authData = await loginResponse.json();
    const railwayToken = authData.token;

    // Fetch all ticket orders
    const ordersResponse = await fetch('https://rodeo-fresh-production-7348.up.railway.app/api/ticket-orders', {
      headers: {
        'Authorization': `Bearer ${railwayToken}`
      }
    });

    if (!ordersResponse.ok) {
      return Response.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    const orders = await ordersResponse.json();
    const order = orders.find(o => o.confirmation_code === confirmationCode);

    if (!order) {
      return Response.json({ 
        found: false, 
        message: `Order with confirmation code ${confirmationCode} not found in Railway`,
        totalOrdersInRailway: orders.length
      });
    }

    return Response.json({ 
      found: true,
      order: order,
      message: `Order found with status: ${order.status}`
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});