import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import QRCode from 'npm:qrcode@1.5.3';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { bar_credit_id } = await req.json();

    if (!bar_credit_id) {
      return Response.json({ error: 'bar_credit_id required' }, { status: 400 });
    }

    // Get bar credit details
    const barCredit = await base44.asServiceRole.entities.BarCredit.get(bar_credit_id);
    console.log('Bar credit details:', JSON.stringify(barCredit, null, 2));
    
    // Generate QR code with confirmation code
    const qrCodeDataUrl = await QRCode.toDataURL(barCredit.confirmation_code, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    console.log('QR code generated for:', barCredit.confirmation_code);
    console.log('QR code data URL length:', qrCodeDataUrl.length);
    
    // Send confirmation email via Resend
    console.log('Sending email to:', barCredit.customer_email);
    const emailResult = await resend.emails.send({
      from: 'Holmdale Pro Rodeo <onboarding@resend.dev>',
      to: barCredit.customer_email,
      subject: 'Your Bar Credits - Ready to Use',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c55e;">Bar Credits Confirmed!</h1>
          <p>Hi ${barCredit.customer_name},</p>
          <p>Your bar credits are ready to use!</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h2 style="margin-top: 0;">Your Confirmation Code</h2>
            <p style="font-family: monospace; font-size: 36px; color: #22c55e; font-weight: bold; letter-spacing: 2px;">
              ${barCredit.confirmation_code}
            </p>
            <p><strong>Credits:</strong> ${barCredit.quantity}</p>
            <p><strong>Value:</strong> $${barCredit.total_price.toFixed(2)}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p><strong>Show this QR code at the bar:</strong></p>
            <img src="${qrCodeDataUrl}" alt="Bar Credit QR Code" style="max-width: 300px;" />
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>How to use:</strong> Show this QR code or confirmation code at the bar to redeem your credits. 
              Each credit can be used individually.
            </p>
          </div>
          
          <p>Enjoy your drinks!</p>
          <p><strong>Holmdale Pro Rodeo Team</strong></p>
        </div>
      `
    });
    console.log('Email result:', JSON.stringify(emailResult, null, 2));

    return Response.json({ 
      success: true, 
      bar_credit: barCredit,
      email_result: emailResult 
    });

  } catch (error) {
    console.error('Test email error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});