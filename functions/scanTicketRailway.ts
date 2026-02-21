import { railwayRequest, ADMIN_ENDPOINTS } from './railwayConfig.js';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { id, token, scanData } = body;

    console.log('=== SCAN TICKET DEBUG ===');
    console.log('Ticket ID:', id);
    console.log('Token received:', token ? 'YES' : 'NO');
    console.log('scanData:', JSON.stringify(scanData));
    console.log('rfid_tag_id in scanData:', scanData?.rfid_tag_id);

    if (!id) {
      return Response.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    if (!token) {
      return Response.json({ error: 'Authentication token required' }, { status: 401 });
    }

    if (!scanData?.rfid_tag_id) {
      return Response.json({ error: 'rfid_tag_id is required in scanData' }, { status: 400 });
    }

    console.log('Calling Railway:', `POST /api/ticket-orders/${id}/scan`);
    console.log('Body being sent:', JSON.stringify({ rfid_tag_id: scanData.rfid_tag_id }));

    const result = await railwayRequest(ADMIN_ENDPOINTS.SCAN_TICKET, {
      method: 'POST',
      token,
      body: { rfid_tag_id: scanData.rfid_tag_id },
      params: { id }
    });

    console.log('Railway response:', JSON.stringify(result));
    console.log('=== END DEBUG ===');
    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('=== SCAN TICKET ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=== END ERROR ===');
    return Response.json({ error: error.message }, { status: 500 });
  }
});