import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { confirmation_code } = body;

    if (!confirmation_code) {
      return Response.json({ error: 'Missing confirmation code' }, { status: 400 });
    }

    // Find the bar credit by confirmation code
    const credits = await base44.asServiceRole.entities.BarCredit.filter({
      confirmation_code: confirmation_code
    });

    if (credits.length === 0) {
      return Response.json({ error: 'Confirmation code not found' }, { status: 404 });
    }

    const credit = credits[0];

    // Check with Moneris if payment was completed
    const checkoutId = Deno.env.get('MONERIS_CHECKOUT_ID');
    const apiToken = Deno.env.get('MONERIS_API_TOKEN');
    const ticket = credit.monaris_transaction_id;

    if (!checkoutId || !apiToken || !ticket) {
      return Response.json({ 
        status: credit.status,
        credit: credit
      });
    }

    // Query Moneris for transaction status
    const monerisQuery = {
      checkout_id: checkoutId,
      api_token: apiToken,
      ticket: ticket,
      action: 'fetch'
    };

    const monerisResponse = await fetch('https://gateway.moneris.com/chkt/request/request.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(monerisQuery)
    });

    if (monerisResponse.ok) {
      const result = await monerisResponse.json();
      
      // If payment was successful, update the bar credit status
      if (result.response?.success && result.response?.status === 'CHARGED') {
        await base44.asServiceRole.entities.BarCredit.update(credit.id, {
          status: 'confirmed'
        });
        
        return Response.json({
          status: 'confirmed',
          credit: { ...credit, status: 'confirmed', id: credit.id }
        });
      }
    }

    return Response.json({
      status: credit.status,
      credit: credit
    });

  } catch (error) {
    console.error('Check bar credit payment status error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});