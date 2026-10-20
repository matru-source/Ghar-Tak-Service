import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId') || searchParams.get('userId') || undefined;
    const phone = searchParams.get('phone') || undefined;
    const status = searchParams.get('status') || undefined;

    let subscriptions = await db.getAllSubscriptions();

    if (customerId || phone) {
      const targetId = (customerId || '').trim().toLowerCase();
      const targetPhone = (phone || customerId || '').replace(/\D/g, '').slice(-10);

      subscriptions = subscriptions.filter((s) => {
        const matchesId = targetId && (s.subscriberId.toLowerCase() === targetId || s.id.toLowerCase() === targetId);
        const subPhoneClean = s.subscriberPhone.replace(/\D/g, '').slice(-10);
        const matchesPhone = targetPhone.length >= 10 && subPhoneClean === targetPhone;
        return matchesId || matchesPhone;
      });
    }

    if (status) {
      subscriptions = subscriptions.filter((s) => s.status === status);
    }

    const now = new Date();
    const activeSub = subscriptions.find((s) => s.status === 'ACTIVE' && new Date(s.expiryDate) > now);
    const hasActiveSubscription = !!activeSub;

    return NextResponse.json({
      success: true,
      subscriptions,
      activeSubscription: activeSub || null,
      hasActiveSubscription,
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
    const {
      tierId = 'tier_user_1mo',
      tierName = 'Zex Surge Protection Plan',
      subscriberType = 'CUSTOMER',
      subscriberId,
      subscriberName = 'Customer',
      subscriberPhone,
      pricePaidInr = 199.0,
      coverageMaxInr = 25000.0,
      durationDays = 365,
    } = body;

    if (!subscriberId && !subscriberPhone) {
      return NextResponse.json(
        { success: false, error: 'Missing subscriberId or subscriberPhone' },
        { status: 400 }
      );
    }

    const startDate = new Date();
    const expiryDate = new Date(Date.now() + durationDays * 24 * 3600 * 1000);

    const subscription = await db.createSubscription({
      tierId,
      tierName,
      subscriberType: (subscriberType as 'CUSTOMER' | 'PARTNER') || 'CUSTOMER',
      subscriberId: subscriberId || `cust_${Date.now()}`,
      subscriberName,
      subscriberPhone: subscriberPhone || '',
      pricePaidInr: Number(pricePaidInr),
      startDate: startDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
      status: 'ACTIVE',
      autoRenew: true,
      coverageMaxInr: Number(coverageMaxInr),
    });

    return NextResponse.json({
      success: true,
      subscription,
      hasActiveSubscription: true,
      activeSubscription: subscription,
      message: `Enrolled successfully in ${tierName}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
