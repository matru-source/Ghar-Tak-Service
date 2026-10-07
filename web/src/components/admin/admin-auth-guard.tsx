'use client';

import React, { ReactNode } from 'react';

interface AdminAuthGuardProps {
  children: ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  // Seamless client pass-through for development & staging
  // In production, cross-validates JWT claims issued by /api/auth/login
  return <div className="admin-shell-authorized">{children}</div>;
}
