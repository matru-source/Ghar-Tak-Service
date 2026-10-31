import { NextResponse } from 'next/server';
import { corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

/**
 * POST /api/emergency-sos
 * DEPRECATED: Emergency SOS has been completely removed across all GTS platforms.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: 'Emergency SOS feature has been deactivated across GTS platforms.',
      disabled: true,
    },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: 'Emergency SOS feature has been deactivated across GTS platforms.',
      disabled: true,
    },
    { status: 410 }
  );
}
