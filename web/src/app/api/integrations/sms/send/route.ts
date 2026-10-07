import { NextRequest } from 'next/server';
import { SmsGateway, SmsTemplateType } from '@/lib/sms-gateway';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, templateType, params } = body;

    if (!phone) {
      return apiError("'phone' recipient is required", 400);
    }
    if (!templateType) {
      return apiError("'templateType' is required", 400);
    }

    const record = await SmsGateway.sendSms(phone, templateType as SmsTemplateType, params || {});

    return apiSuccess(
      record,
      `SMS message successfully delivered to ${record.recipientPhone} via ${record.provider} (${record.latencyMs}ms)`
    );
  } catch (error) {
    return apiError(
      'SMS delivery failed',
      400,
      error instanceof Error ? error.message : String(error)
    );
  }
}
