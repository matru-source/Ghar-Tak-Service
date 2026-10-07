import React from 'react';
import { PartnerSidebar } from '@/components/partner/partner-sidebar';
import { PartnerTopbar } from '@/components/partner/partner-topbar';

export const metadata = {
  title: 'ElectriCare Partner CRM — Maharashtra Regional Command Hub',
  description: 'Territory dispatch console, SLA escalation monitoring & regional fleet roster for Maharashtra franchise hub',
};

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex font-sans antialiased">
      {/* Navigation Sidebar */}
      <PartnerSidebar />

      {/* Main Application Canvas */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        <PartnerTopbar />
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
