import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { PaymentGateway } from '@/lib/payment-gateway';
import { db } from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-razorpay-signature');
    if (!signature) {
      return apiError('Missing x-razorpay-signature header', 400);
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    if (!webhookSecret) {
      return apiError('Server configuration error: RAZORPAY_WEBHOOK_SECRET is not configured', 500);
    }

    const rawBody = await request.text();
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    const isSigValid = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);

    if (!isSigValid) {
      console.error('[RAZORPAY_WEBHOOK_SIGNATURE_MISMATCH] Received invalid webhook signature.');
      return apiError('Invalid cryptographic webhook signature', 400);
    }

    const body = JSON.parse(rawBody);
    const webhookResult = PaymentGateway.processWebhook(body, signature);

    // If payment captured via webhook, ensure commission ledgers are settled
    if (webhookResult.event === 'payment.captured' && webhookResult.orderId) {
      const order = PaymentGateway.getOrder(webhookResult.orderId);
      if (order) {
        try {
          await db.distributeJobCommissions(order.invoiceId, {
            paymentMethod: 'UPI',
            transactionRef: order.razorpayPaymentId || `wh_pay_${Date.now()}`,
          });
        } catch {
          // If already settled, silently pass
        }
      }
    }

    return apiSuccess(
      webhookResult,
      `Webhook event '${webhookResult.event}' acknowledged and processed successfully.`
    );
  } catch (error) {
    return apiError(
      'Webhook processing failed',
      400,
      error instanceof Error ? error.message : String(error)
    );
  }
}
