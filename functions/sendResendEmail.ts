import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { to, from, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return Response.json({ error: 'to, subject, and html are required' }, { status: 400 });
    }

    // Send email via Resend
    const result = await resend.emails.send({
      from: from || 'Holmdale Pro Rodeo <info@holmdalerodeo.ca>', // Change to your verified domain
      to: to,
      subject: subject,
      html: html
    });

    console.log('Resend email sent:', result);

    return Response.json({ 
      success: true,
      result: result
    });

  } catch (error) {
    console.error('Resend email error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});