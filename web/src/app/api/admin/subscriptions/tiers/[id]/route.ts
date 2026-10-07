import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tier = await db.getSubscriptionTierById(id);
    if (!tier) {
      return NextResponse.json({ success: false, error: 'Subscription tier not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, tier });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch tier' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await db.updateSubscriptionTier(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Subscription tier not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      tier: updated,
      message: `Updated tier ${updated.name} successfully`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update tier' },
      { status: 500 }
    );
  }
}
