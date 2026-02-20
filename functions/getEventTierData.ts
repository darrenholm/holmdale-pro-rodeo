import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { eventId } = body;

    if (!eventId) {
      return Response.json({ error: 'Missing eventId' }, { status: 400 });
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
      return Response.json({ error: 'Authentication failed' }, { status: 500 });
    }

    const authData = await loginResponse.json();
    const railwayToken = authData.token;

    // Fetch event from Railway to get tier data
    const eventResponse = await fetch(`https://rodeo-fresh-production-7348.up.railway.app/api/events/${eventId}`, {
      headers: {
        'Authorization': `Bearer ${railwayToken}`
      }
    });

    if (!eventResponse.ok) {
      const error = await eventResponse.text();
      console.error('Failed to fetch event:', error);
      return Response.json({ error: 'Failed to fetch event' }, { status: 500 });
    }

    const event = await eventResponse.json();
    
    // Calculate current tier based on tickets sold
    const ticketsSold = event.tickets_sold || 0;
    let currentTier = 1;
    if (ticketsSold >= event.tier2_quantity) {
      currentTier = 3;
    } else if (ticketsSold >= event.tier1_quantity) {
      currentTier = 2;
    }

    const tierData = {
      currentTier,
      ticketsSold,
      adultPrice: parseFloat(event[`tier${currentTier}_adult_price`] || '30'),
      childPrice: 10,
      familyPrice: parseFloat(event[`tier${currentTier}_family_price`] || '70'),
      tiers: {
        tier1: {
          quantity: event.tier1_quantity || 1000,
          sold: event.tier1_sold || 0,
          price: parseFloat(event.tier1_adult_price || '30')
        },
        tier2: {
          quantity: event.tier2_quantity || 1000,
          sold: event.tier2_sold || 0,
          price: parseFloat(event.tier2_adult_price || '35')
        },
        tier3: {
          quantity: event.tier3_quantity || 1000,
          sold: event.tier3_sold || 0,
          price: parseFloat(event.tier3_adult_price || '40')
        }
      }
    };

    return Response.json(tierData);

  } catch (error) {
    console.error('Error in getEventTierData:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});