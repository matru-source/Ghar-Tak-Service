// ==============================================================================
// Ghar Tak Services (GTS) - Enterprise Brevo Transactional Email Service
// Strictly Server-Side Execution (API Keys never exposed to client APKs)
// ==============================================================================

interface SendBrevoEmailParams {
  toEmail: string;
  toName?: string;
  subject: string;
  htmlContent: string;
}

export async function sendBrevoEmail({
  toEmail,
  toName = 'Valued User',
  subject,
  htmlContent,
}: SendBrevoEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error('[Brevo] BREVO_API_KEY is not defined in environment variables');
    return { success: false, error: 'BREVO_API_KEY is not configured on server' };
  }
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'notifications@ghartak.in';
  const senderName = process.env.BREVO_SENDER_NAME || 'Ghar Tak Services (GTS)';

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: toEmail.trim().toLowerCase(),
            name: toName.trim() || 'GTS User',
          },
        ],
        subject,
        htmlContent,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('[BREVO_EMAIL_ERROR] Failed to send email:', data);
      return {
        success: false,
        error: data.message || `Brevo API returned status ${response.status}`,
      };
    }

    return {
      success: true,
      messageId: data.messageId,
    };
  } catch (error) {
    console.error('[BREVO_EMAIL_EXCEPTION]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Sends a branded, secure OTP verification email via Brevo.
 */
export async function sendOtpEmail(
  toEmail: string,
  toName: string,
  otpCode: string,
  purpose: 'RESET_PASSWORD' | 'REGISTER' | 'LOGIN' | 'GENERAL' = 'RESET_PASSWORD'
): Promise<{ success: boolean; error?: string }> {
  const purposeTitle =
    purpose === 'RESET_PASSWORD'
      ? 'Password Reset Request'
      : purpose === 'REGISTER'
      ? 'Account Verification'
      : 'Secure Sign-In Code';

  const purposeDesc =
    purpose === 'RESET_PASSWORD'
      ? 'We received a request to reset the password for your Ghar Tak Services account.'
      : purpose === 'REGISTER'
      ? 'Thank you for registering with Ghar Tak Services. Please verify your email to activate your account.'
      : 'Use the one-time security code below to complete your sign-in.';

  const subject = `⚡ [GTS] ${otpCode} is your ${purposeTitle} verification code`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${purposeTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FAFC; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="540" cellpadding="0" cellspacing="0" style="max-width: 540px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06); border: 1px solid #E2E8F0;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0A2540 0%, #1A365D 50%, #FF8A00 100%); padding: 28px 24px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">GHAR TAK SERVICES</h1>
              <p style="margin: 4px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">On-Demand Electrical & Safety Services</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="margin: 0 0 12px 0; color: #0F172A; font-size: 18px; font-weight: 700;">${purposeTitle}</h2>
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 14px; line-height: 22px;">Hello <strong>${toName || 'Valued User'}</strong>,</p>
              <p style="margin: 0 0 24px 0; color: #475569; font-size: 14px; line-height: 22px;">${purposeDesc}</p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #F1F5F9; border: 2px dashed #CBD5E1; border-radius: 12px; padding: 18px 24px; display: inline-block;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0A2540;">${otpCode}</span>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; color: #64748B; font-size: 13px; line-height: 20px; text-align: center;">
                ⏱️ This code is valid for <strong>5 minutes</strong>. Do not share it with anyone.
              </p>

              <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />

              <p style="margin: 0; color: #94A3B8; font-size: 11.5px; line-height: 18px;">
                <strong>Security Alert:</strong> Ghar Tak Services staff will never ask for your password, PIN, or verification code. If you did not request this verification code, please ignore this email or secure your account.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 18px 24px; text-align: center; border-top: 1px solid #E2E8F0;">
              <p style="margin: 0; color: #94A3B8; font-size: 11px;">
                © ${new Date().getFullYear()} Ghar Tak Services (GTS). All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  return sendBrevoEmail({
    toEmail,
    toName,
    subject,
    htmlContent,
  });
}
