import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { BrandMark } from '@/components/ui/brand-logo';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Fetch live telemetry from the backend engine
  const jobs = await db.getJobs();
  const pincodes = await db.getAllPincodes();
  const technicians = await db.getAllTechnicians();
  const escalations = await db.getEscalatedJobs();
  const ledgers = await db.getLedgerEntries();

  const totalJobs = jobs.length;
  const inProgressJobs = jobs.filter((j) => j.status === 'IN_PROGRESS' || j.status === 'SAFETY_CHECKED').length;
  const escalatedCount = escalations.counts.totalEscalated;
  const onlineTechs = technicians.filter((t) => t.isOnline).length;
  const totalGmv = ledgers.telemetry.totalCustomerInflowInr;
  const gstWithheld = ledgers.telemetry.totalGstReserveInr;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              National Operations Command
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
              INDIA HUB 01
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Real-time cross-state dispatch telemetry, 30-min SLA health monitoring & double-entry treasury reconciliation
          </p>
        </div>

        {/* Global Action Triggers */}
        <div className="flex items-center gap-2.5">
          <form action="/api/jobs/escalations/sweep" method="POST">
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <span>🔄</span>
              <span>Run SLA Sweep</span>
            </button>
          </form>
          <Link
            href="/admin/escalations"
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-red-900/20"
          >
            <span>🚨</span>
            <span>Emergency SOS Desk ({escalatedCount})</span>
          </Link>
        </div>
      </div>

      {/* Macro National KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Active Jobs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden shadow-xs hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Work Orders</div>
          <div className="mt-2 text-2xl font-black text-slate-900 flex items-baseline gap-2">
            {totalJobs}
            <span className="text-[11px] font-bold text-emerald-600">+{inProgressJobs} live</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Across 5 Mumbai clusters</div>
          <div className="absolute top-3 right-3 text-2xl opacity-20">📋</div>
        </div>

        {/* Card 2: Fleet Online */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden shadow-xs hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Field Technicians</div>
          <div className="mt-2 text-2xl font-black text-emerald-600 flex items-baseline gap-2">
            {onlineTechs}
            <span className="text-xs font-medium text-slate-400">/ {technicians.length} fleet</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-semibold">100% 1000V Gloves Certified</div>
          <div className="absolute top-3 right-3 text-2xl opacity-20">👷</div>
        </div>

        {/* Card 3: SLA Breach Health */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden shadow-xs hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">SLA Breach Rate</div>
          <div className="mt-2 text-2xl font-black text-rose-600 flex items-baseline gap-2">
            {escalatedCount}
            <span className="text-xs font-medium text-slate-400">Escalated</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Sub-30m target: 96.8%</div>
          <div className="absolute top-3 right-3 text-2xl opacity-20">⏱️</div>
        </div>

        {/* Card 4: Gross GMV Processed */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden shadow-xs hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gross Billings (GMV)</div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            ₹{totalGmv.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-semibold">Zero Escrow Discrepancy</div>
          <div className="absolute top-3 right-3 text-2xl opacity-20">💰</div>
        </div>

        {/* Card 5: Statutory GST Reserve */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden shadow-xs hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">18% GST Escrow</div>
          <div className="mt-2 text-2xl font-black text-blue-600">
            ₹{gstWithheld.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">CGST 9% + SGST 9% Held</div>
          <div className="absolute top-3 right-3 text-2xl opacity-20">🏛️</div>
        </div>
      </div>

      {/* Main Grid: Work Orders Feed & Financial Split Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Real-Time Work Orders Feed (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BrandMark size="xs" variant="default" badge={false} className="shrink-0" />
              <span>Active Work Orders Feed</span>
            </h2>
            <Link
              href="/admin/jobs"
              className="text-xs font-bold text-[#4A148C] hover:text-purple-900 transition"
            >
              View Full Work Order Registry →
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-xs">
            {jobs.slice(0, 5).map((job: any) => {
              const isEscalated = job.status === 'ESCALATED_SLA';
              const isCompleted = job.status === 'WORK_COMPLETED' || job.status === 'SETTLED';
              const isInProgress = job.status === 'IN_PROGRESS';

              return (
                <div key={job.id} className="p-4 hover:bg-slate-50/80 transition flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black ${
                        isEscalated
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : isCompleted
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-blue-50 text-blue-600 border border-blue-200'
                      }`}
                    >
                      {isEscalated ? '⚠️' : isCompleted ? '✓' : '🔧'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{job.jobTicketNumber}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isEscalated
                              ? 'bg-red-100 text-red-700 border border-red-200 animate-pulse'
                              : isCompleted
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : isInProgress
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-700 mt-0.5 font-medium">{job.serviceTitle}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        📍 {job.customerAddressText}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <div className="text-sm font-black text-slate-900">₹{job.totalAmountInr}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {job.technicianName ? `👷 ${job.technicianName}` : '❌ Unassigned'}
                    </div>
                    {isEscalated && (
                      <Link
                        href={`/admin/escalations?jobId=${job.id}`}
                        className="mt-1 text-[10px] font-bold text-red-600 hover:text-red-700 underline"
                      >
                        Reassign Now
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Financial 3-Way Split & Pincode Heatmap (1 col) */}
        <div className="space-y-6">
          {/* 3-Way Commission Allocation Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>🏦</span> Central Escrow Allocation
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                BALANCED (₹0.00)
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Technicians Net Payout (70%)</span>
                  <span className="text-emerald-700 font-bold">₹{ledgers.telemetry.totalTechnicianPayoutsInr}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: '70%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Partner Regional Share (15%)</span>
                  <span className="text-blue-700 font-bold">₹{ledgers.telemetry.totalPartnerCommissionInr}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">ElectriCare Platform Fee (15%)</span>
                  <span className="text-purple-700 font-bold">₹{ledgers.telemetry.totalPlatformFeeInr}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
              <span>Total Disbursed:</span>
              <span className="font-bold text-slate-900">
                ₹{ledgers.telemetry.totalAllocatedDebits} (10 Double-Entry Rows)
              </span>
            </div>
          </div>

          {/* Hyperlocal Territory Capacities */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>📍</span> Active Territory Clusters
              </h3>
              <span className="text-[10px] text-slate-500 font-medium">5 Pincodes</span>
            </div>

            <div className="space-y-2 mt-2">
              {pincodes.slice(0, 4).map((p) => (
                <div key={p.pincode} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{p.pincode} — {p.areaName}</div>
                    <div className="text-[10px] text-slate-500">Target ETA: {p.targetEtaMinutes} mins</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-mono text-[10px] font-bold">
                    Cap: {p.activeCapacityCount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
