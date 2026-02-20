Deno.serve(async (req) => {
  try {
    const { confirmation_code } = await req.json();

    if (!confirmation_code) {
      return Response.json({ error: 'Confirmation code required' }, { status: 400 });
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
      console.error('Failed to authenticate with Railway');
      return Response.json({ error: 'Authentication failed' }, { status: 500 });
    }

    const authData = await loginResponse.json();
    const railwayToken = authData.token;

    // Find the ticket order
    const ticketsResponse = await fetch('https://rodeo-fresh-production-7348.up.railway.app/api/ticket-orders', {
      headers: { 'Authorization': `Bearer ${railwayToken}` }
    });

    if (!ticketsResponse.ok) {
      return Response.json({ error: 'Failed to fetch ticket order' }, { status: 500 });
    }

    const tickets = await ticketsResponse.json();
    const ticketOrder = tickets.find(t => t.confirmation_code === confirmation_code);

    if (!ticketOrder) {
      return Response.json({ error: 'Ticket order not found' }, { status: 404 });
    }

    // Get event details
    const eventsResponse = await fetch('https://rodeo-fresh-production-7348.up.railway.app/api/events', {
      headers: { 'Authorization': `Bearer ${railwayToken}` }
    });

    let eventDetails = {
      name: 'Holmdale Rodeo',
      date: 'TBD',
      location: 'Holmdale Rodeo Grounds'
    };

    if (eventsResponse.ok) {
      const events = await eventsResponse.json();
      const event = events.find(e => e.id === ticketOrder.event_id);
      if (event) {
        eventDetails = {
          name: event.name || 'Holmdale Rodeo',
          date: event.date || 'TBD',
          location: event.location || 'Holmdale Rodeo Grounds'
        };
      }
    }

    // Generate QR code
    const QRCode = (await import('npm:qrcode@1.5.3')).default;
    const qrData = JSON.stringify({
      confirmation_code: ticketOrder.confirmation_code,
      customer_name: ticketOrder.customer_name,
      event: eventDetails.name,
      quantity_adult: ticketOrder.quantity_adult || 0,
      quantity_child: ticketOrder.quantity_child || 0
    });
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });

    // Create email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #22c55e; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; }
          .qr-code { text-align: center; margin: 30px 0; }
          .qr-code img { max-width: 300px; }
          .details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Holmdale Rodeo Tickets</h1>
          </div>
          <div class="content">
            <p>Hello ${ticketOrder.customer_name},</p>
            <p>Here are your ticket details for the ${eventDetails.name}:</p>
            
            <div class="details">
              <p><strong>Event:</strong> ${eventDetails.name}</p>
              <p><strong>Date:</strong> ${eventDetails.date}</p>
              <p><strong>Location:</strong> ${eventDetails.location}</p>
              <p><strong>Adults:</strong> ${ticketOrder.quantity_adult || 0}</p>
              <p><strong>Children:</strong> ${ticketOrder.quantity_child || 0}</p>
              <p><strong>Confirmation Code:</strong> ${ticketOrder.confirmation_code}</p>
            </div>

            <div class="qr-code">
              <p><strong>Your Ticket QR Code:</strong></p>
              <img src="${qrCodeDataUrl}" alt="Ticket QR Code" />
              <p style="font-size: 12px; color: #666;">Please present this QR code at the gate</p>
            </div>

            <p>We look forward to seeing you at the rodeo!</p>
          </div>
          <div class="footer">
            <p>Holmdale Rodeo | holmdalerodeo.ca</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Holmdale Rodeo <tickets@holmdalerodeo.ca>',
        to: ticketOrder.customer_email,
        subject: `Your Holmdale Rodeo Tickets - ${ticketOrder.confirmation_code}`,
        html: emailHtml
      })
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error('Resend API error:', errorData);
      return Response.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('Resend email error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});