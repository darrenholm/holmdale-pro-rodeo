import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { code } = await req.json();

    if (!code) {
      return Response.json({ error: 'Code required' }, { status: 400 });
    }

    const searchCode = code.trim().toUpperCase();
    const allTickets = await base44.asServiceRole.entities.TicketOrder.list();
    
    const results = allTickets.filter(t => 
      t.confirmation_code && t.confirmation_code.toUpperCase() === searchCode
    );

    return Response.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});