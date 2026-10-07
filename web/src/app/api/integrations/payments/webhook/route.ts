import { NextRequest } from 'next/server';
import { PaymentGateway } from '@/lib/payment-gateway';
import { db } from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-razorpay-signature') || undefined;
    const body = await request.json();

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
