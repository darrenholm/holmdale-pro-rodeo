import QRCode from 'npm:qrcode';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { confirmation_code } = body;

    console.log('=== PAYMENT SUCCESS HANDLER ===');
    console.log('Full request body:', JSON.stringify(body, null, 2));
    console.log('Confirmation code received:', confirmation_code);

    if (!confirmation_code) {
      console.error('ERROR: No confirmation code in request');
      return Response.json({ error: 'Missing confirmation_code' }, { status: 400 });
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

    // Find ticket order in Railway - get all orders and filter by confirmation code
    const ticketsUrl = 'https://rodeo-fresh-production-7348.up.railway.app/api/ticket-orders';
    console.log('Fetching all ticket orders from:', ticketsUrl);
    
    const ticketsResponse = await fetch(ticketsUrl, {
      headers: { 'Authorization': `Bearer ${railwayToken}` }
    });

    console.log('Ticket orders fetch status:', ticketsResponse.status);

    if (!ticketsResponse.ok) {
      const errorText = await ticketsResponse.text();
      console.error('ERROR: Failed to fetch ticket orders');
      console.error('Response status:', ticketsResponse.status);
      console.error('Response body:', errorText);
      return Response.json({ 
        error: 'Failed to fetch ticket orders', 
        details: errorText 
      }, { status: 500 });
    }

    const allTicketOrders = await ticketsResponse.json();
    console.log(`Found ${allTicketOrders.length} total ticket orders`);
    
    // Find the order with matching confirmation code
    const ticketOrder = allTicketOrders.find(order => order.confirmation_code === confirmation_code);
    
    if (!ticketOrder) {
      console.error('ERROR: No ticket order found with confirmation code:', confirmation_code);
      console.log('Available confirmation codes:', allTicketOrders.map(o => o.confirmation_code).slice(0, 10));
      return Response.json({ 
        error: 'Ticket order not found', 
        confirmation_code,
        searched_orders: allTicketOrders.length 
      }, { status: 404 });
    }
    console.log('Found ticket order:', {
      id: ticketOrder.id,
      confirmation_code: ticketOrder.confirmation_code,
      customer_email: ticketOrder.customer_email,
      status: ticketOrder.status,
      quantity_adult: ticketOrder.quantity_adult,
      quantity_child: ticketOrder.quantity_child
    });

    // Update status to confirmed
    await fetch(`https://rodeo-fresh-production-7348.up.railway.app/api/ticket-orders/${ticketOrder.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${railwayToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'confirmed' })
    });

    // Get event details from Railway
    let event;
    try {
      const eventResponse = await fetch(`https://rodeo-fresh-production-7348.up.railway.app/api/events/${ticketOrder.event_id}`, {
        headers: { 'Authorization': `Bearer ${railwayToken}` }
      });
      event = await eventResponse.json();
      
      // Decrement available tickets using the new endpoint
      const decrementBody = {
        quantity_adult: ticketOrder.ticket_type === 'general' ? (ticketOrder.quantity_adult || 0) : 0,
        quantity_child: ticketOrder.ticket_type === 'child' ? (ticketOrder.quantity_child || 0) : 0,
        quantity_family: ticketOrder.ticket_type === 'family' ? 1 : 0
      };
      
      console.log(`Decrementing tickets for event ${ticketOrder.event_id}:`, decrementBody);
      
      const decrementResponse = await fetch(`https://rodeo-fresh-production-7348.up.railway.app/api/events/${ticketOrder.event_id}/decrement-tickets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${railwayToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(decrementBody)
      });
      
      if (decrementResponse.ok) {
        const updatedEvent = await decrementResponse.json();
        console.log('Tickets decremented successfully:', updatedEvent);
      } else {
        console.error('Failed to decrement tickets:', await decrementResponse.text());
      }
    } catch (e) {
      console.log('Event not found in Railway, using defaults');
      event = {
        id: ticketOrder.event_id,
        title: 'Holmdale Pro Rodeo 2026',
        date: new Date().toISOString().split('T')[0],
        time: 'TBA',
        venue: 'Holmdale Farms'
      };
    }

    // Generate QR code
    const qrCodeData = JSON.stringify({
      confirmation_code: ticketOrder.confirmation_code,
      event_id: ticketOrder.event_id,
      ticket_type: ticketOrder.ticket_type,
      quantity_adult: ticketOrder.quantity_adult,
      quantity_child: ticketOrder.quantity_child,
      customer_email: ticketOrder.customer_email
    });
    
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
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
          .header { background: #1c1917; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f5f5f4; }
          .ticket-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .qr-section { text-align: center; padding: 30px; background: white; margin: 20px 0; border-radius: 8px; }
          .qr-code { max-width: 300px; margin: 20px auto; display: block; }
          .confirmation-code { font-size: 24px; font-weight: bold; color: #1c1917; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #78716c; font-size: 14px; }
          table { width: 100%; }
          td { padding: 8px 0; }
          .label { font-weight: bold; color: #78716c; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎟️ Your Tickets are Confirmed!</h1>
          </div>
          
          <div class="content">
            <p>Hi ${ticketOrder.customer_name},</p>
            <p>Thank you for your purchase! Your tickets for <strong>${event.title}</strong> are confirmed.</p>
            
            <div class="ticket-details">
              <h2>Event Details</h2>
              <table>
                <tr>
                  <td class="label">Event:</td>
                  <td>${event.title}</td>
                </tr>
                <tr>
                  <td class="label">Date:</td>
                  <td>${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                </tr>
                <tr>
                  <td class="label">Time:</td>
                  <td>${event.time}</td>
                </tr>
                <tr>
                  <td class="label">Venue:</td>
                  <td>${event.venue || 'TBA'}</td>
                </tr>
                <tr>
                  <td class="label">Ticket Type:</td>
                  <td>${ticketOrder.ticket_type.toUpperCase()}</td>
                </tr>
                <tr>
                  <td class="label">Quantity:</td>
                  <td>${ticketOrder.quantity_adult || 0} Adult${(ticketOrder.quantity_adult || 0) !== 1 ? 's' : ''}${ticketOrder.quantity_child ? `, ${ticketOrder.quantity_child} Child${ticketOrder.quantity_child !== 1 ? 'ren' : ''}` : ''}</td>
                </tr>
              </table>
            </div>

            <div class="qr-section">
              <h2>Your Entry Pass</h2>
              <p>Show this QR code at the gate for entry:</p>
              <div class="confirmation-code">${ticketOrder.confirmation_code}</div>
              <img src="${qrCodeDataUrl}" alt="Ticket QR Code" class="qr-code" style="max-width: 300px; height: auto; display: block; margin: 20px auto;" />
              <p style="color: #78716c; font-size: 14px; margin-top: 20px;">
                Save this email or take a screenshot of the QR code<br>
                You can also show your confirmation code at the gate
              </p>
            </div>

            <p>We look forward to seeing you at the event! If you have any questions, please contact us.</p>
          </div>
          
          <div class="footer">
            <p>This is an automated confirmation email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    console.log('Sending confirmation email to:', ticketOrder.customer_email);
    const emailResult = await resend.emails.send({
      from: 'Holmdale Pro Rodeo <info@holmdalerodeo.ca>',
      to: ticketOrder.customer_email,
      subject: `Your Tickets for ${event.title} - Confirmation #${ticketOrder.confirmation_code}`,
      html: emailHtml
    });

    console.log('✓ Email sent successfully! ID:', emailResult.id);
    console.log('=== PAYMENT SUCCESS COMPLETE ===');
    return Response.json({ success: true, email_sent: true, email_id: emailResult.id });

  } catch (error) {
    console.error('Payment success handler error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});