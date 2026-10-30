import React from 'react';
import { PartnerShell } from '@/components/partner/partner-shell';
import { PartnerAuthGuard } from '@/components/partner/partner-auth-guard';
import { PartnerLiveProvider } from '@/components/partner/partner-live-provider';

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
      <PartnerLiveProvider>
        <PartnerShell>{children}</PartnerShell>
      </PartnerLiveProvider>
    </PartnerAuthGuard>
  );
}
