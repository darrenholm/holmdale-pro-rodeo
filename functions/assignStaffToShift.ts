Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { shift_id, staff_ids, token } = body;

    if (!token) {
      return Response.json({ error: 'Authentication token required' }, { status: 401 });
    }

    if (!shift_id) {
      return Response.json({ error: 'shift_id required' }, { status: 400 });
    }

    // Login to Railway to get token
    const loginResponse = await fetch('https://rodeo-fresh-production-7348.up.railway.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'ww_admin',
        password: 'SecurePass123!'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Railway authentication failed');
    }

    const { token: railwayToken } = await loginResponse.json();

    // Update shift with assigned staff (array of IDs)
    const updateResponse = await fetch(`https://rodeo-fresh-production-7348.up.railway.app/api/shifts/${shift_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${railwayToken}`
      },
      body: JSON.stringify({
        staff_ids: staff_ids || []
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to assign staff: ${errorText}`);
    }

    const updatedShift = await updateResponse.json();
    return Response.json({ success: true, data: updatedShift });
  } catch (error) {
    console.error('[assignStaffToShift] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});