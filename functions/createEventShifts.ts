Deno.serve(async (req) => {
  try {
    // Login to Railway
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

    const { token } = await loginResponse.json();

    // Define shifts for July 31 - August 2, 2026
    const shifts = [
      // July 31, 2026
      { date: '2026-07-31', start_time: '16:00', end_time: '20:00', role: 'gate', notes: 'Evening gate staff' },
      { date: '2026-07-31', start_time: '16:00', end_time: '20:00', role: 'gate', notes: 'Evening gate staff' },
      { date: '2026-07-31', start_time: '17:00', end_time: '23:00', role: 'bar', notes: 'Bar service' },
      { date: '2026-07-31', start_time: '17:00', end_time: '23:00', role: 'bar', notes: 'Bar service' },
      { date: '2026-07-31', start_time: '15:00', end_time: '19:00', role: 'ticket_booth', notes: 'Ticket sales' },
      { date: '2026-07-31', start_time: '16:00', end_time: '22:00', role: 'security', notes: 'Event security' },
      { date: '2026-07-31', start_time: '16:00', end_time: '22:00', role: 'security', notes: 'Event security' },
      
      // August 1, 2026
      { date: '2026-08-01', start_time: '16:00', end_time: '20:00', role: 'gate', notes: 'Evening gate staff' },
      { date: '2026-08-01', start_time: '16:00', end_time: '20:00', role: 'gate', notes: 'Evening gate staff' },
      { date: '2026-08-01', start_time: '17:00', end_time: '23:00', role: 'bar', notes: 'Bar service' },
      { date: '2026-08-01', start_time: '17:00', end_time: '23:00', role: 'bar', notes: 'Bar service' },
      { date: '2026-08-01', start_time: '15:00', end_time: '19:00', role: 'ticket_booth', notes: 'Ticket sales' },
      { date: '2026-08-01', start_time: '16:00', end_time: '22:00', role: 'security', notes: 'Event security' },
      { date: '2026-08-01', start_time: '16:00', end_time: '22:00', role: 'security', notes: 'Event security' },
      
      // August 2, 2026
      { date: '2026-08-02', start_time: '16:00', end_time: '20:00', role: 'gate', notes: 'Evening gate staff' },
      { date: '2026-08-02', start_time: '16:00', end_time: '20:00', role: 'gate', notes: 'Evening gate staff' },
      { date: '2026-08-02', start_time: '17:00', end_time: '23:00', role: 'bar', notes: 'Bar service' },
      { date: '2026-08-02', start_time: '17:00', end_time: '23:00', role: 'bar', notes: 'Bar service' },
      { date: '2026-08-02', start_time: '15:00', end_time: '19:00', role: 'ticket_booth', notes: 'Ticket sales' },
      { date: '2026-08-02', start_time: '16:00', end_time: '22:00', role: 'security', notes: 'Event security' },
      { date: '2026-08-02', start_time: '16:00', end_time: '22:00', role: 'security', notes: 'Event security' },
    ];

    const createdShifts = [];

    // Create each shift
    for (const shift of shifts) {
      const createResponse = await fetch('https://rodeo-fresh-production-7348.up.railway.app/api/shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(shift)
      });

      if (createResponse.ok) {
        const created = await createResponse.json();
        createdShifts.push(created);
      }
    }

    console.log(`Created ${createdShifts.length} shifts`);

    return Response.json({ 
      success: true, 
      message: `Created ${createdShifts.length} shifts for July 31 - August 2`,
      shifts: createdShifts
    });
  } catch (error) {
    console.error('[createEventShifts] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});