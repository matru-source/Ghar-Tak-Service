import React from 'react';
import { PartnerShell } from '@/components/partner/partner-shell';
import { PartnerAuthGuard } from '@/components/partner/partner-auth-guard';

export const metadata = {
  title: 'Ghar Tak Service Partner CRM — Regional Operations Hub',
  description: 'Territory dispatch console, multi-service catalog management & regional fleet roster for Ghar Tak Service',
};

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PartnerAuthGuard>
      <PartnerShell>{children}</PartnerShell>
    </PartnerAuthGuard>
  );
}
