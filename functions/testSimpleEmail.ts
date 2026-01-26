import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  try {
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'email required' }, { status: 400 });
    }

    console.log('Attempting to send email to:', email);
    
    const emailResult = await resend.emails.send({
      from: 'Holmdale Pro Rodeo <onboarding@resend.dev>',
      to: email,
      subject: 'Test Email - Bar Credits',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c55e;">Test Email</h1>
          <p>This is a test email to verify email delivery is working.</p>
          <p>If you receive this, the email system is functioning correctly.</p>
        </div>
      `
    });
    
    console.log('Resend result:', JSON.stringify(emailResult, null, 2));

    return Response.json({ 
      success: true,
      email_result: emailResult,
      sent_to: email
    });

  } catch (error) {
    console.error('Email error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});