import { NextRequest } from 'next/server';
import { generateAndStoreOtp, normalizePhoneNumber } from '@/lib/otp';
import { SmsGateway } from '@/lib/sms-gateway';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone || typeof phone !== 'string') {
      return apiError('Valid phone number is required', 400);
    }

    const cleanPhone = normalizePhoneNumber(phone);
    if (!/^\+91[6-9]\d{9}$/.test(cleanPhone)) {
      return apiError('Please enter a valid 10-digit Indian mobile number (+91XXXXXXXXXX)', 400);
    }

    const { code, expiresAt } = generateAndStoreOtp(cleanPhone);

    // Dispatch real SMS via configured provider (Fast2SMS / Twilio / Mock Sandbox)
    let smsRecord = null;
    try {
      smsRecord = await SmsGateway.sendSms(cleanPhone, 'AUTH_LOGIN_OTP', { otp: code });
    } catch (smsErr) {
      console.warn(`[SMS_DISPATCH_WARNING] Could not dispatch SMS:`, smsErr);
    }

    return apiSuccess(
      {
        phone: cleanPhone,
        expiresAt: expiresAt.toISOString(),
        smsDeliveryStatus: smsRecord?.deliveryStatus || 'QUEUED',
        // Return devOtp in development so mobile developers and testers can log in immediately
        devOtp: process.env.NODE_ENV !== 'production' ? code : undefined,
      },
      `OTP sent successfully to ${cleanPhone}`,
      200
    );
  } catch (error) {
    return apiError('Failed to process OTP request', 500, error instanceof Error ? error.message : String(error));
  }
}
