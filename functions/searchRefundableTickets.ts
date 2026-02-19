import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { searchType, searchValue } = await req.json();

    if (!searchValue) {
      return Response.json({ error: 'Search value required' }, { status: 400 });
    }

    let results = [];

    if (searchType === 'code') {
      // Search by confirmation code
      results = await base44.asServiceRole.entities.TicketOrder.filter({
        confirmation_code: searchValue.trim().toUpperCase()
      });
    } else if (searchType === 'txn') {
      // Search by moneris_transaction_id (only tickets with valid transaction IDs)
      const allTickets = await base44.asServiceRole.entities.TicketOrder.list();
      results = allTickets.filter(t => 
        t.moneris_transaction_id && 
        t.moneris_transaction_id.toString().toUpperCase().includes(searchValue.trim().toUpperCase())
      );
    }

    return Response.json({ results });

  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});