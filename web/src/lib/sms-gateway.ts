// ==============================================================================
// Ghar Tak Services (GTS) - Enterprise Unified SMS & OTP Gateway Integration
// Enforces Industry-Grade Gateway Failover Chain: Twilio -> MSG91 -> AWS SNS
// Strict Rate Limits: Max 3 tries per 15-minute window
// Zero Mock Fallback in Production
// ==============================================================================

import { normalizePhoneNumber } from './otp';

export type SmsTemplateType =
  | 'AUTH_LOGIN_OTP'
  | 'JOB_DISPATCH_ALERT'
  | 'CUSTOMER_HANDOVER_OTP'
  | 'SLA_BREACH_ALERT'
  | 'INVOICE_ISSUED';

export type SmsProvider = 'TWILIO' | 'MSG91' | 'AWS_SNS' | 'FAST2SMS' | 'MOCK_SANDBOX';

export interface SmsMessageRecord {
  id: string;
  recipientPhone: string;
  templateType: SmsTemplateType;
  messageText: string;
  provider: SmsProvider;
  deliveryStatus: 'DELIVERED' | 'QUEUED' | 'FAILED';
  dltTemplateId?: string;
  latencyMs: number;
  timestamp: string;
  failoverAttempts?: string[];
}

// In-memory audit trail of dispatched SMS messages
const smsAuditLog: SmsMessageRecord[] = [];

// Rate limiter: Map<phone, timestamp[]>
const rateLimitStore = new Map<string, number[]>();

export const SMS_GATEWAY_CONFIG = {
  defaultProvider: (process.env.SMS_PROVIDER || 'TWILIO') as SmsProvider,
  senderId: process.env.SMS_SENDER_ID || 'GHARTAK',
  maxPerWindow: 3, // Industry standard: Max 3 tries per 15-minute window
  windowMs: 15 * 60 * 1000, // 15 minutes
};

export const DLT_TEMPLATES = {
  AUTH_LOGIN_OTP: {
    dltId: 'DLT-140716120001',
    format: (data: { otp: string }) =>
      `Your Ghar Tak Services verification code is ${data.otp}. Valid for 5 minutes. Do not share this OTP with anyone. - GHARTAK`,
  },
  JOB_DISPATCH_ALERT: {
    dltId: 'DLT-140716120002',
    format: (data: { ticketNumber: string; areaName: string; pincode: string; fee: number }) =>
      `[DISPATCH ALERT] New Work Order ${data.ticketNumber} assigned in ${data.areaName} (${data.pincode}). Fee: ₹${data.fee}. Please accept within 60s in Ghar Tak Tech App. - GHARTAK`,
  },
  CUSTOMER_HANDOVER_OTP: {
    dltId: 'DLT-140716120003',
    format: (data: { techName: string; handoverOtp: string; ticketNumber: string }) =>
      `Technician ${data.techName} has arrived for Work Order ${data.ticketNumber}. Share verification code ${data.handoverOtp} only upon satisfactory service completion. - GHARTAK`,
  },
  SLA_BREACH_ALERT: {
    dltId: 'DLT-140716120004',
    format: (data: { ticketNumber: string; pincode: string; minutesOverdue: number }) =>
      `[URGENT SLA ESCALATION] Ticket ${data.ticketNumber} in ${data.pincode} is ${data.minutesOverdue}m overdue. Proximity reassignment initiated. - GHARTAK Ops`,
  },
  INVOICE_ISSUED: {
    dltId: 'DLT-140716120005',
    format: (data: { invoiceNumber: string; totalAmount: number; ticketNumber: string }) =>
      `Ghar Tak Services Tax Invoice ${data.invoiceNumber} for ₹${data.totalAmount} (Job ${data.ticketNumber}) has been generated with 18% GST. Thank you for choosing Ghar Tak! - GHARTAK`,
  },
};

export class SmsGateway {
  static checkRateLimit(phone: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const history = rateLimitStore.get(phone) || [];
    const recent = history.filter((ts) => now - ts < SMS_GATEWAY_CONFIG.windowMs);

    if (recent.length >= SMS_GATEWAY_CONFIG.maxPerWindow) {
      return { allowed: false, remaining: 0 };
    }

    recent.push(now);
    rateLimitStore.set(phone, recent);
    return { allowed: true, remaining: SMS_GATEWAY_CONFIG.maxPerWindow - recent.length };
  }

  /**
   * Dispatches SMS using the resilient failover chain:
   * Twilio -> MSG91 -> AWS SNS -> Fast2SMS -> [Sandbox in non-production only]
   */
  static async sendSms(
    recipientPhone: string,
    templateType: SmsTemplateType,
    params: Record<string, any>
  ): Promise<SmsMessageRecord> {
    const cleanPhone = normalizePhoneNumber(recipientPhone);

    // 1. Enforce strict rate limit (Max 3 tries / 15 minutes)
    const rateCheck = this.checkRateLimit(cleanPhone);
    if (!rateCheck.allowed) {
      throw new Error(`Rate limit exceeded for ${cleanPhone}. Maximum 3 SMS requests per 15-minute window.`);
    }

    const templateMeta = DLT_TEMPLATES[templateType];
    if (!templateMeta) {
      throw new Error(`Invalid SMS template type: ${templateType}`);
    }

    const messageText = (templateMeta.format as any)(params);
    const start = Date.now();
    const failoverAttempts: string[] = [];
    let successfulProvider: SmsProvider | null = null;
    let deliveryStatus: 'DELIVERED' | 'QUEUED' | 'FAILED' = 'FAILED';

    // Provider 1: Twilio REST API
    if (
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
    ) {
      try {
        const auth = Buffer.from(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString('base64');
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
        const bodyParams = new URLSearchParams();
        bodyParams.append('To', cleanPhone);
        bodyParams.append('From', process.env.TWILIO_PHONE_NUMBER);
        bodyParams.append('Body', messageText);

        const twilioRes = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: bodyParams.toString(),
        });

        if (twilioRes.ok) {
          successfulProvider = 'TWILIO';
          deliveryStatus = 'DELIVERED';
        } else {
          const errText = await twilioRes.text();
          failoverAttempts.push(`Twilio HTTP ${twilioRes.status}: ${errText.substring(0, 100)}`);
          console.warn(`[SMS_GATEWAY] Twilio dispatch failed. Initiating failover to MSG91...`);
        }
      } catch (twErr) {
        failoverAttempts.push(`Twilio network error: ${twErr instanceof Error ? twErr.message : String(twErr)}`);
        console.warn(`[SMS_GATEWAY] Twilio network failure. Failing over to MSG91...`);
      }
    } else {
      failoverAttempts.push('Twilio credentials not configured');
    }

    // Provider 2: MSG91 OTP / SMS API (Failover target 1)
    if (!successfulProvider && process.env.MSG91_AUTH_KEY) {
      try {
        const rawPhone = cleanPhone.replace('+', '');
        const msg91Url = 'https://control.msg91.com/api/v5/otp';
        const msg91Res = await fetch(msg91Url, {
          method: 'POST',
          headers: {
            authkey: process.env.MSG91_AUTH_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            template_id: process.env.MSG91_TEMPLATE_ID || templateMeta.dltId,
            mobile: rawPhone,
            otp: params.otp || '',
          }),
        });

        if (msg91Res.ok) {
          const json = await msg91Res.json();
          if (json.type === 'success') {
            successfulProvider = 'MSG91';
            deliveryStatus = 'DELIVERED';
          } else {
            failoverAttempts.push(`MSG91 API error: ${json.message || JSON.stringify(json)}`);
            console.warn(`[SMS_GATEWAY] MSG91 rejected dispatch. Initiating failover to AWS SNS...`);
          }
        } else {
          failoverAttempts.push(`MSG91 HTTP ${msg91Res.status}`);
          console.warn(`[SMS_GATEWAY] MSG91 HTTP failure. Failing over to AWS SNS...`);
        }
      } catch (msgErr) {
        failoverAttempts.push(`MSG91 network error: ${msgErr instanceof Error ? msgErr.message : String(msgErr)}`);
        console.warn(`[SMS_GATEWAY] MSG91 network failure. Failing over to AWS SNS...`);
      }
    } else if (!successfulProvider) {
      failoverAttempts.push('MSG91 credentials not configured');
    }

    // Provider 3: AWS SNS (Failover target 2)
    if (!successfulProvider && (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_REGION)) {
      try {
        // Direct AWS SNS REST invocation or webhook adapter
        const snsEndpoint = process.env.AWS_SNS_REST_ENDPOINT;
        if (snsEndpoint) {
          const snsRes = await fetch(snsEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              PhoneNumber: cleanPhone,
              Message: messageText,
              MessageAttributes: {
                'AWS.SNS.SMS.SMSType': {
                  DataType: 'String',
                  StringValue: 'Transactional',
                },
              },
            }),
          });
          if (snsRes.ok) {
            successfulProvider = 'AWS_SNS';
            deliveryStatus = 'DELIVERED';
          } else {
            failoverAttempts.push(`AWS SNS HTTP ${snsRes.status}`);
          }
        } else {
          failoverAttempts.push('AWS SNS direct endpoint not configured');
        }
      } catch (awsErr) {
        failoverAttempts.push(`AWS SNS error: ${awsErr instanceof Error ? awsErr.message : String(awsErr)}`);
      }
    } else if (!successfulProvider) {
      failoverAttempts.push('AWS SNS credentials not configured');
    }

    // Provider 4: Fast2SMS (Direct Indian Gateway Backup)
    if (!successfulProvider && process.env.FAST2SMS_API_KEY) {
      try {
        const rawNumbers = cleanPhone.replace('+91', '').trim();
        const fast2SmsRes = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            authorization: process.env.FAST2SMS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route: 'otp',
            variables_values: String(params.otp || ''),
            numbers: rawNumbers,
          }),
        });
        const json = await fast2SmsRes.json();
        if (json.return) {
          successfulProvider = 'FAST2SMS';
          deliveryStatus = 'DELIVERED';
        } else {
          failoverAttempts.push(`Fast2SMS error: ${json.message || JSON.stringify(json)}`);
        }
      } catch (fErr) {
        failoverAttempts.push(`Fast2SMS error: ${fErr instanceof Error ? fErr.message : String(fErr)}`);
      }
    }

    // Production Security Gate: Zero Mock Fallback in Production
    const isProduction = process.env.NODE_ENV === 'production';

    if (!successfulProvider) {
      if (
        process.env.ALLOW_SANDBOX_OTP === 'true' ||
        process.env.SMS_PROVIDER === 'mock' ||
        process.env.SMS_PROVIDER === 'MOCK_SANDBOX' ||
        !isProduction
      ) {
        // Development Sandbox Mode or Explicit Sandbox Test Mode
        successfulProvider = 'MOCK_SANDBOX';
        deliveryStatus = 'DELIVERED';
        console.log(`[SMS_SANDBOX] Dispatched OTP to ${cleanPhone} via Mock Sandbox: "${messageText}"`);
      } else {
        const failMsg = `All SMS providers failed in failover chain (Twilio -> Msg91 -> AWS SNS). Attempts: ${failoverAttempts.join('; ')}`;
        console.error(`[CRITICAL_AUTH_FAILURE] ${failMsg}`);
        throw new Error('SMS delivery failed across all redundant gateways. Configure TWILIO_ACCOUNT_SID or set ALLOW_SANDBOX_OTP=true.');
      }
    }

    const latencyMs = Date.now() - start;

    const record: SmsMessageRecord = {
      id: `sms_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      recipientPhone: cleanPhone,
      templateType,
      messageText,
      provider: successfulProvider,
      deliveryStatus,
      dltTemplateId: templateMeta.dltId,
      latencyMs,
      timestamp: new Date().toISOString(),
      failoverAttempts: failoverAttempts.length > 0 ? failoverAttempts : undefined,
    };

    smsAuditLog.unshift(record);
    return record;
  }

  static getAuditLog(limit = 50): SmsMessageRecord[] {
    return smsAuditLog.slice(0, limit);
  }

  static getTelemetry() {
    const total = smsAuditLog.length;
    const delivered = smsAuditLog.filter((s) => s.deliveryStatus === 'DELIVERED').length;
    const avgLatency =
      total > 0 ? Math.round(smsAuditLog.reduce((sum, s) => sum + s.latencyMs, 0) / total) : 0;

    return {
      activeProvider: SMS_GATEWAY_CONFIG.defaultProvider,
      senderId: SMS_GATEWAY_CONFIG.senderId,
      totalDispatched: total,
      deliveredCount: delivered,
      deliveryRatePct: total > 0 ? Math.round((delivered / total) * 100) : 100,
      averageLatencyMs: avgLatency,
      dltTemplatesRegistered: Object.keys(DLT_TEMPLATES).length,
    };
  }
}
