import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import QRCode from 'npm:qrcode';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { bar_credit_id } = body;

    if (!bar_credit_id) {
      return Response.json({ error: 'Missing bar_credit_id' }, { status: 400 });
    }

    // Get bar credit
    const barCredit = await base44.asServiceRole.entities.BarCredit.get(bar_credit_id);
    if (!barCredit) {
      return Response.json({ error: 'Bar credit not found' }, { status: 404 });
    }

    // Generate QR code as data URL
    const qrCodeData = JSON.stringify({
      confirmation_code: barCredit.confirmation_code,
      quantity: barCredit.quantity,
      remaining_credits: barCredit.remaining_credits,
      customer_email: barCredit.customer_email
    });
    
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    console.log('QR code generated for bar credit');

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
          .credit-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
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
            <h1>🍺 Bar Credits Confirmed!</h1>
          </div>
          
          <div class="content">
            <p>Hi ${barCredit.customer_name},</p>
            <p>Thank you for your purchase! Your bar credits are ready to use.</p>
            
            <div class="credit-details">
              <h2>Purchase Details</h2>
              <table>
                <tr>
                  <td class="label">Credits Purchased:</td>
                  <td>${barCredit.quantity}</td>
                </tr>
                <tr>
                  <td class="label">Credits Available:</td>
                  <td>${barCredit.remaining_credits}</td>
                </tr>
                <tr>
                  <td class="label">Price per Credit:</td>
                  <td>$${barCredit.price_per_credit.toFixed(2)}</td>
                </tr>
                <tr>
                  <td class="label">Total Paid:</td>
                  <td>$${barCredit.total_price.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <div class="qr-section">
              <h2>Your Redemption Code</h2>
              <p>Show this QR code at the bar to redeem your credits:</p>
              <div class="confirmation-code">${barCredit.confirmation_code}</div>
              <img src="${qrCodeDataUrl}" alt="Bar Credit QR Code" class="qr-code" style="max-width: 300px; height: auto; display: block; margin: 20px auto;" />
              <p style="color: #78716c; font-size: 14px; margin-top: 20px;">
                Save this email or take a screenshot of the QR code<br>
                You can also show your confirmation code at the bar
              </p>
            </div>

            <p>Each credit can be redeemed for one drink at the bar. Simply show this code when ordering!</p>
          </div>
          
          <div class="footer">
            <p>This is an automated confirmation email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using Core.SendEmail
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Holmdale Rodeo',
      to: barCredit.customer_email,
      subject: `Your Bar Credits - Confirmation #${barCredit.confirmation_code}`,
      body: emailHtml
    });

    console.log('Bar credit confirmation email sent:', barCredit.confirmation_code);
    return Response.json({ success: true, message: 'Confirmation email sent' });

  } catch (error) {
    console.error('Error sending bar credit confirmation:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});