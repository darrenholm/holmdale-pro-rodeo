Deno.serve(async (req) => {
  try {
    // Login to Railway to get token
    const loginResponse = await fetch('https://rodeo-fresh-production-7348.up.railway.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'darren@holmgraphics.ca',
        password: 'changeme123'
      })
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error('[Login Error]', errorText);
      throw new Error('Railway authentication failed');
    }

    const { token } = await loginResponse.json();

    const url = 'https://rodeo-fresh-production-7348.up.railway.app/api/shifts';
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Railway API error: ${response.status} - ${errorText}`);
    }

    const shifts = await response.json();
    console.log('Railway API response:', shifts);
    console.log('Shifts data type:', Array.isArray(shifts) ? 'array' : typeof shifts);
    console.log('Number of shifts from Railway:', Array.isArray(shifts) ? shifts.length : shifts.data?.length || 0);
    // Railway returns array directly, wrap in data property for frontend
    return Response.json({ success: true, data: Array.isArray(shifts) ? shifts : shifts.data || [] });
  } catch (error) {
    console.error('[getShiftsFromRailway] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});