import React from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminAuthGuard } from '@/components/admin/admin-auth-guard';

export const metadata = {
  title: 'Ghar Tak Service Admin & Owner CRM — National Command Console',
  description: 'National overview, dispatch telemetry, franchise accounting & WORM compliance for Pan-India electrical services',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGuard>
      <AdminShell>{children}</AdminShell>
    </AdminAuthGuard>
  );
}
