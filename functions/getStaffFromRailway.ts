Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return Response.json({ error: 'Authentication token required' }, { status: 401 });
    }

    const url = 'https://rodeo-fresh-production-7348.up.railway.app/api/staff';
    
    console.log('[URL]', url);
    console.log('[Token]', token);
    console.log('[Auth Header]', `Bearer ${token}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('[Response Status]', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('[Error Response]', errorText);
      throw new Error(`Railway API error: ${response.status} - ${errorText}`);
    }

    const staff = await response.json();
    return Response.json({ success: true, data: staff });
  } catch (error) {
    console.log('[Caught Error]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});