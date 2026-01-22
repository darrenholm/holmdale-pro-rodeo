import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'email required' }, { status: 400 });
    }

    console.log('Attempting to send email to:', email);
    
    const emailResult = await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      from_name: 'Holmdale Pro Rodeo',
      subject: 'Test Email - Bar Credits',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c55e;">Test Email</h1>
          <p>This is a test email to verify email delivery is working.</p>
          <p>If you receive this, the email system is functioning correctly.</p>
        </div>
      `
    });
    
    console.log('SendEmail result:', JSON.stringify(emailResult, null, 2));

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