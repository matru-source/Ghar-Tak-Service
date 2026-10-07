import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const subscriberType = searchParams.get('subscriberType') || undefined;
    const search = searchParams.get('search') || undefined;

    const subscriptions = await db.getAllSubscriptions({ status, subscriberType, search });
    const tiers = await db.getSubscriptionTiers();
    const telemetry = await db.getSubscriptionsTelemetry();

    return NextResponse.json({
      success: true,
      subscriptions,
      tiers,
      telemetry,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tierId, tierName, subscriberType, subscriberId, subscriberName, subscriberPhone, pricePaidInr, startDate, expiryDate, coverageMaxInr, autoRenew } = body;

    if (!tierId || !subscriberId || !subscriberName || !subscriberPhone || !pricePaidInr) {
      return NextResponse.json(
        { success: false, error: 'Missing required subscription fields' },
        { status: 400 }
      );
    }

    const created = await db.createSubscription({
      tierId,
      tierName: tierName || 'Zex Surge Protection Plan',
      subscriberType: subscriberType || 'CUSTOMER',
      subscriberId,
      subscriberName,
      subscriberPhone,
      pricePaidInr: Number(pricePaidInr),
      startDate: startDate || new Date().toISOString(),
      expiryDate: expiryDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      status: 'ACTIVE',
      autoRenew: autoRenew ?? true,
      coverageMaxInr: Number(coverageMaxInr) || 25000,
    });

    return NextResponse.json({
      success: true,
      subscription: created,
      message: `Enrolled ${created.subscriberName} into ${created.tierName} successfully`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to enroll subscriber' },
      { status: 500 }
    );
  }
}
