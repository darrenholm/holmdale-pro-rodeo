Deno.serve(async (req) => {
  try {
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
      return Response.json({ error: 'Authentication failed' }, { status: 500 });
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

    const allOrders = await ordersResponse.json();

    // Filter for today's orders (status = 'confirmed' means payment succeeded)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = allOrders.filter(order => {
      // Show all confirmed orders or check for today if date is available
      if (order.status !== 'confirmed') return false;
      
      const orderDate = new Date(order.created_at || order.updated_at || new Date());
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });

    // Calculate totals
    let totalRevenue = 0;
    let totalTickets = 0;
    const byType = {};

    todayOrders.forEach(order => {
      totalRevenue += parseFloat(order.total_price || 0);
      const qty = (order.quantity_adult || 0) + (order.quantity_child || 0);
      totalTickets += qty;
      
      const type = order.ticket_type;
      if (!byType[type]) {
        byType[type] = { count: 0, revenue: 0, quantity: 0 };
      }
      byType[type].count += 1;
      byType[type].revenue += parseFloat(order.total_price || 0);
      byType[type].quantity += qty;
    });

    return Response.json({
      date: today.toISOString().split('T')[0],
      totalOrders: todayOrders.length,
      totalTickets,
      totalRevenue: totalRevenue.toFixed(2),
      byType,
      orders: todayOrders.sort((a, b) => new Date(b.created_at || b.updatedAt) - new Date(a.created_at || a.updatedAt))
    });
  } catch (error) {
    console.error('Error fetching ticket sales:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});