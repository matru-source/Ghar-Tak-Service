import React from 'react';
import { PartnerShell } from '@/components/partner/partner-shell';

export const metadata = {
  title: 'ElectriCare Partner CRM — Maharashtra Regional Command Hub',
  description: 'Territory dispatch console, SLA escalation monitoring & regional fleet roster for Maharashtra franchise hub',
};

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PartnerShell>{children}</PartnerShell>;
}
