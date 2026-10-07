import { NextRequest } from 'next/server';
import { PaymentGateway } from '@/lib/payment-gateway';
import { db } from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, razorpayPaymentId, razorpaySignature, paymentMethod } = body;

    if (!orderId || !razorpayPaymentId) {
      return apiError("'orderId' and 'razorpayPaymentId' are required", 400);
    }

    const { isValid, order } = PaymentGateway.verifyPaymentSignature(
      orderId,
      razorpayPaymentId,
      razorpaySignature || `mock_sig_${razorpayPaymentId}`
    );

    if (!isValid || !order) {
      return apiError('Payment signature verification failed. Tampered or invalid token.', 400);
    }

    // Trigger double-entry commission distribution & settle invoice
    const settlementResult = await db.distributeJobCommissions(order.invoiceId, {
      paymentMethod: paymentMethod || 'UPI',
      transactionRef: razorpayPaymentId,
    });

    return apiSuccess(
      {
        order,
        settlement: settlementResult,
      },
      `Payment '${razorpayPaymentId}' verified successfully! ₹${order.amountInr} settled. 3-way commission distributed and double-entry ledgers recorded.`,
      200
    );
  } catch (error) {
    return apiError(
      'Payment verification failed',
      400,
      error instanceof Error ? error.message : String(error)
    );
  }
}
