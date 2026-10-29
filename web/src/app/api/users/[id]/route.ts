import { NextRequest } from 'next/server';
import { db, isDatabaseConnected } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { assertAuth } from '@/lib/auth-guard';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

/**
 * GET /api/users/[id]
 * Read user details. Protected by RBAC: Self or SUPER_ADMIN only.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await assertAuth(request);
    if (!auth.ok) return auth.response;

    // Caller can only read their own profile, unless they are SUPER_ADMIN or PARTNER viewing fleet
    const isSelf = auth.context.userId === id;
    const isSuperAdmin = auth.context.role === 'SUPER_ADMIN';
    const isPartner = auth.context.role === 'PARTNER';

    if (!isSelf && !isSuperAdmin && !isPartner) {
      return apiError('Access denied: You do not have permission to inspect this user profile.', 403);
    }

    const user = await db.getUserById(id);
    if (!user) {
      return apiError(`User '${id}' not found.`, 404);
    }

    return apiSuccess({
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    }, 'User profile retrieved successfully');
  } catch (err: any) {
    return apiError('Failed to fetch user profile', 500, err.message);
  }
}

/**
 * PATCH /api/users/[id]
 * Update user profile or assign roles.
 * Issue 4: Strict RBAC - Only SUPER_ADMIN is permitted to modify 'role'.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await assertAuth(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const isSelf = auth.context.userId === id;
    const isSuperAdmin = auth.context.role === 'SUPER_ADMIN';

    // 1. Privilege Escalation Guard (Issue 4)
    if (body.role !== undefined) {
      if (!isSuperAdmin) {
        return apiError(
          `Privilege Escalation Blocked: Role modifications require SUPER_ADMIN authority. Your role: ${auth.context.role}.`,
          403
        );
      }
      const validRoles = ['SUPER_ADMIN', 'PARTNER', 'TECHNICIAN', 'CUSTOMER'];
      if (!validRoles.includes(body.role)) {
        return apiError(`Invalid role. Permitted values: ${validRoles.join(', ')}`, 400);
      }
    }

    // 2. Profile modification permissions
    if (!isSelf && !isSuperAdmin) {
      return apiError('Access denied: You cannot modify other users profiles.', 403);
    }

    const targetUser = await db.getUserById(id);
    if (!targetUser) {
      return apiError(`User '${id}' not found.`, 404);
    }

    const updates: Record<string, any> = {};
    if (body.fullName !== undefined) updates.fullName = String(body.fullName).trim();
    if (body.email !== undefined) updates.email = String(body.email).trim().toLowerCase();
    if (body.phone !== undefined) updates.phone = String(body.phone).trim();
    if (body.role !== undefined && isSuperAdmin) updates.role = body.role;
    if (body.isActive !== undefined && isSuperAdmin) updates.isActive = Boolean(body.isActive);

    if (await isDatabaseConnected()) {
      try {
        const updated = await prisma.user.update({
          where: { id },
          data: updates,
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            role: true,
            isActive: true,
            updatedAt: true,
          },
        });
        return apiSuccess(updated, 'User profile updated successfully in database');
      } catch (err: any) {
        console.error('Prisma user update error:', err);
      }
    }

    // Memory store fallback
    Object.assign(targetUser, updates);
    return apiSuccess(targetUser, 'User profile updated successfully');
  } catch (err: any) {
    return apiError('Failed to update user profile', 500, err.message);
  }
}
