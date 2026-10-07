import React from 'react';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminTopbar } from '@/components/admin/admin-topbar';
import { AdminAuthGuard } from '@/components/admin/admin-auth-guard';

export const metadata = {
  title: 'ElectriCare Admin & Owner CRM — National Command Console',
  description: 'National overview, dispatch telemetry, franchise accounting & WORM compliance for Pan-India electrical services',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex font-sans antialiased">
        {/* Navigation Sidebar */}
        <AdminSidebar />

        {/* Main Application Canvas */}
        <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
          <AdminTopbar />
          <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
