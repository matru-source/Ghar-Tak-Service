import { NextRequest } from 'next/server';
import { generateAndStoreOtp, normalizePhoneNumber } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/brevo';
import { SmsGateway } from '@/lib/sms-gateway';
import { db } from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

/**
 * POST /api/auth/otp/send
 * Dispatches dynamic cryptographic OTP via Brevo (Email) or SMS Gateway (Mobile).
 * Strictly server-side execution: API keys are never exposed to client devices.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawIdentifier = (body.identifier || body.email || body.phone || '').trim();
    const purpose = (body.purpose || 'GENERAL') as 'RESET_PASSWORD' | 'REGISTER' | 'LOGIN' | 'GENERAL';

    if (!rawIdentifier) {
      return apiError('Email address or mobile number is required', 400);
    }

    const isEmail = rawIdentifier.includes('@');

    if (isEmail) {
      const email = rawIdentifier.toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return apiError('Please enter a valid email address', 400);
      }

      // If resetting password, verify account exists first (prevents spamming arbitrary emails)
      if (purpose === 'RESET_PASSWORD') {
        const existingUser = await db.getUserByIdentifier(email);
        if (!existingUser) {
          return apiError(`No registered account found with '${email}'. Please register or check your email.`, 404);
        }
      }

      const existingUser = await db.getUserByIdentifier(email);
      const recipientName = existingUser?.fullName || body.name || 'Valued User';

      const { code, expiresAt } = generateAndStoreOtp(email, purpose);

      // Dispatch transactional email via Brevo API
      const emailResult = await sendOtpEmail(email, recipientName, code, purpose);

      if (!emailResult.success) {
        console.error('[OTP_SEND_ERROR] Brevo dispatch failed:', emailResult.error);
        return apiError(`Failed to dispatch verification email: ${emailResult.error}`, 502);
      }

      return apiSuccess(
        {
          identifier: email,
          deliveryChannel: 'EMAIL',
          expiresAt: expiresAt.toISOString(),
        },
        `Security verification code sent to ${email}. Please check your inbox.`,
        200
      );
    } else {
      // Mobile SMS Flow
      const cleanPhone = normalizePhoneNumber(rawIdentifier);
      if (!/^\+91[6-9]\d{9}$/.test(cleanPhone)) {
        return apiError('Please enter a valid 10-digit Indian mobile number (+91XXXXXXXXXX)', 400);
      }

      if (purpose === 'RESET_PASSWORD') {
        const existingUser = await db.getUserByIdentifier(cleanPhone);
        if (!existingUser) {
          return apiError(`No registered account found with mobile number '${cleanPhone}'.`, 404);
        }
      }

      const { code, expiresAt } = generateAndStoreOtp(cleanPhone, purpose);

      let smsRecord = null;
      try {
        smsRecord = await SmsGateway.sendSms(cleanPhone, 'AUTH_LOGIN_OTP', { otp: code });
      } catch (smsErr) {
        console.warn(`[SMS_DISPATCH_WARNING] Could not dispatch SMS:`, smsErr);
      }

      return apiSuccess(
        {
          identifier: cleanPhone,
          deliveryChannel: 'SMS',
          expiresAt: expiresAt.toISOString(),
          smsDeliveryStatus: smsRecord?.deliveryStatus || 'QUEUED',
        },
        `Security verification code sent via SMS to ${cleanPhone}.`,
        200
      );
    }
  } catch (error) {
    return apiError('Failed to process verification code request', 500, error instanceof Error ? error.message : String(error));
  }
}
