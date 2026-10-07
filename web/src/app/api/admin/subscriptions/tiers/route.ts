import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const tiers = await db.getSubscriptionTiers();
    return NextResponse.json({
      success: true,
      tiers,
      count: tiers.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch tiers' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, code, targetAudience, priceInr, durationMonths, surgeProtectionCoverageInr, freeInspectionsCount, isPrioritySosDispatch, applianceWarrantyIncluded, cyberShieldAuditIncluded, description } = body;

    if (!name || !code || priceInr === undefined) {
      return NextResponse.json(
        { success: false, error: 'Name, code, and price are required' },
        { status: 400 }
      );
    }

    const tier = await db.createSubscriptionTier({
      name,
      code,
      targetAudience: targetAudience || 'CONSUMER',
      priceInr: Number(priceInr),
      durationMonths: Number(durationMonths) || 1,
      surgeProtectionCoverageInr: Number(surgeProtectionCoverageInr) || 25000,
      freeInspectionsCount: Number(freeInspectionsCount) || 1,
      isPrioritySosDispatch: isPrioritySosDispatch ?? true,
      applianceWarrantyIncluded: applianceWarrantyIncluded ?? true,
      cyberShieldAuditIncluded: cyberShieldAuditIncluded ?? false,
      isActive: true,
      description: description || 'Zex Surge Protection Tier',
    });

    return NextResponse.json({
      success: true,
      tier,
      message: `Tier ${tier.name} created successfully`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create tier' },
      { status: 500 }
    );
  }
}
