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
 * Dispatches dynamic cryptographic OTP via Brevo (Email) or SMS Gateway Failover Chain (Mobile).
 * Enforces strict rate limits (max 3 tries per 15 min) and automated lockout.
 * Zero mock OTP exposure in production.
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
    const isProduction = process.env.NODE_ENV === 'production';

    if (isEmail) {
      const email = rawIdentifier.toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return apiError('Please enter a valid email address', 400);
      }

      // If resetting password, verify account exists first
      if (purpose === 'RESET_PASSWORD') {
        const existingUser = await db.getUserByIdentifier(email);
        if (!existingUser) {
          return apiError(`No registered account found with '${email}'. Please create an account or verify your email.`, 404);
        }
      }

      const existingUser = await db.getUserByIdentifier(email);
      const recipientName = existingUser?.fullName || body.name || 'Valued User';

      // Rate-limited cryptographic token generation (throws on rate limit / lockout)
      let code: string;
      let expiresAt: Date;
      try {
        const otpData = generateAndStoreOtp(email, purpose);
        code = otpData.code;
        expiresAt = otpData.expiresAt;
      } catch (rateErr) {
        return apiError(rateErr instanceof Error ? rateErr.message : String(rateErr), 429);
      }

      console.log(`[OTP_DISPATCH] Purpose: ${purpose}, Email: ${email}`);

      // Dispatch transactional email via Brevo API
      const emailResult = await sendOtpEmail(email, recipientName, code, purpose);

      if (!emailResult.success) {
        if (!process.env.BREVO_API_KEY) {
          if (isProduction) {
            return apiError('Email delivery service is unconfigured. Contact security administrator.', 503);
          }
          console.warn(`[OTP_FALLBACK_DEV] BREVO_API_KEY not configured. Dev code: ${code}`);
          return apiSuccess(
            {
              identifier: email,
              deliveryChannel: 'EMAIL',
              expiresAt: expiresAt.toISOString(),
              devOtp: code,
            },
            `Verification code generated (Dev Sandbox Mode)`,
            200
          );
        }
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

      // Rate-limited cryptographic token generation
      let code: string;
      let expiresAt: Date;
      try {
        const otpData = generateAndStoreOtp(cleanPhone, purpose);
        code = otpData.code;
        expiresAt = otpData.expiresAt;
      } catch (rateErr) {
        return apiError(rateErr instanceof Error ? rateErr.message : String(rateErr), 429);
      }

      // Dispatch via SMS failover chain (Twilio -> Msg91 -> AWS SNS)
      try {
        const smsRecord = await SmsGateway.sendSms(cleanPhone, 'AUTH_LOGIN_OTP', { otp: code });
        return apiSuccess(
          {
            identifier: cleanPhone,
            deliveryChannel: 'SMS',
            provider: smsRecord.provider,
            expiresAt: expiresAt.toISOString(),
            smsDeliveryStatus: smsRecord.deliveryStatus,
          },
          `Security verification code sent via SMS to ${cleanPhone}.`,
          200
        );
      } catch (smsErr) {
        const errMessage = smsErr instanceof Error ? smsErr.message : String(smsErr);
        if (errMessage.includes('Rate limit')) {
          return apiError(errMessage, 429);
        }
        console.error(`[SMS_DISPATCH_FAILURE] ${errMessage}`);
        return apiError(errMessage, 503);
      }
    }
  } catch (error) {
    return apiError('Failed to process verification code request', 500, error instanceof Error ? error.message : String(error));
  }
}
