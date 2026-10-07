'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building,
  Zap,
  Users,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Check,
  ChevronRight,
  Info,
} from '@/components/ui/icons';
import { BrandLogo, BrandMark } from '@/components/ui/brand-logo';

export default function PartnerAppOverviewPage() {
  const router = useRouter();
  const [activeZone, setActiveZone] = useState('West Zone • 6 Pincodes');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 text-slate-900 pb-16 select-none relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <BrandMark size="sm" badgeBg="bg-emerald-50 border border-emerald-200 shadow-2xs" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                GTS MH Operations
              </span>
            </div>
            <h1 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
              Maharashtra Team Hub
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => router.push('/partner-app/escalations')}
            className="w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center relative transition-colors"
            aria-label="Escalation Alerts"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white"></span>
          </button>
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            OP
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="px-4 pt-3 space-y-3.5">
        {/* Operational Overview Header & Live Sub-bar */}
        <section className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                Live & Dispatching
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-500" />
              <span>West Zone • 6 Pincodes</span>
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-slate-100">
            <div>
              <p className="text-[11px] text-slate-500">Franchise Territory Node</p>
              <h2 className="font-extrabold text-base text-slate-900 tracking-tight">
                Maharashtra Operations
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase border border-emerald-200">
              Active Partner
            </span>
          </div>
        </section>

        {/* Critical Escalation Priority Alert Banner */}
        <section className="p-4 rounded-2xl bg-gradient-to-br from-red-50 via-white to-red-50/50 border border-red-200 shadow-sm relative overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-red-600 text-white font-extrabold text-[10px] uppercase tracking-wider">
                  Urgent SLA
                </span>
                <span className="text-[11px] text-red-700 font-semibold">Avg 14m left</span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 mt-1">
                3 Job Escalations Require Dispatch
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                High cancellation probability in Bandra & Colaba zones.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Link
                  href="/partner-app/escalations"
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-colors"
                >
                  <span>Resolve 3 Escalations</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => showToast('Escalation logs filtered for past 24 hours')}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                  aria-label="History"
                >
                  <Clock className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* High-Priority Key Operational Metrics Grid (4 Bento Cards) */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Operations Overview</h3>
            <span className="text-[11px] text-slate-500 font-medium">Today • Realtime</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Metric 1: Today's Jobs */}
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">Today&apos;s Jobs</span>
                <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center text-blue-700">
                  <Zap className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-1.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900">284</span>
                  <span className="text-[11px] text-emerald-700 font-bold">+14%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1.5 flex">
                  <div className="bg-emerald-500 h-full w-[74%]"></div>
                  <div className="bg-blue-500 h-full w-[19%]"></div>
                  <div className="bg-orange-500 h-full w-[7%]"></div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 truncate">210 Done • 56 Active • 18 En Route</p>
            </div>

            {/* Metric 2: Field Engineers */}
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">Field Engineers</span>
                <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-1.5">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900">18</span>
                  <span className="text-sm text-slate-400 font-semibold">/ 24</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <span className="text-[11px] text-emerald-700 font-semibold">6 Ready to Dispatch</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500">75% Fleet Utilization</p>
            </div>

            {/* Metric 3: Total Volume */}
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">Total Volume</span>
                <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center text-amber-700">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-1.5">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 tracking-tight">₹4.2L</span>
                </div>
                <p className="text-[11px] text-emerald-700 font-bold mt-0.5">Partner Cut: ₹42,000</p>
              </div>
              <p className="text-[10px] text-slate-500">10% Platform Commission</p>
            </div>

            {/* Metric 4: SLA Risk */}
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">SLA Risk</span>
                <div className="w-6 h-6 rounded-md bg-red-100 flex items-center justify-center text-red-700">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-1.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-red-600">3</span>
                  <span className="text-[10px] text-red-700 font-extrabold uppercase">Action req.</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">2 Unaccepted • 1 Breach</p>
              </div>
              <p className="text-[10px] text-slate-500">Max Delay: 18 mins</p>
            </div>
          </div>
        </section>

        {/* Territory Pincode Capacity Heatmap Cards */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Territory Pincode Densities</h3>
            <span className="text-[11px] text-emerald-700 font-bold">Maharashtra Hub</span>
          </div>

          <div className="space-y-2">
            {/* Pincode 1: 400001 (Colaba) */}
            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs text-slate-900">400001 (Colaba)</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                    Primary Hub
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">4/4 Technicians Active • Avg ETA 11m</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-xs text-emerald-700">98% SLA</span>
                <span className="text-[10px] text-slate-400 block">High Capacity</span>
              </div>
            </div>

            {/* Pincode 2: 400020 (Fort) */}
            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs text-slate-900">400020 (Fort / Nariman Pt)</span>
                  <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[9px] font-bold">
                    Commercial
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">3/4 Technicians Active • Avg ETA 14m</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-xs text-blue-700">94% SLA</span>
                <span className="text-[10px] text-slate-400 block">Optimal</span>
              </div>
            </div>

            {/* Pincode 3: 400050 (Bandra West) */}
            <div className="p-2.5 rounded-xl border border-red-200 bg-red-50/40 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs text-slate-900">400050 (Bandra West)</span>
                  <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-800 text-[9px] font-bold">
                    SLA Alert
                  </span>
                </div>
                <span className="text-[11px] text-red-700 font-medium">1/3 Technicians Active • Delay Risk</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-xs text-red-600">85% SLA</span>
                <span className="text-[10px] text-red-700 font-bold block">Need Reassign</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Action Navigation Grid */}
        <section className="grid grid-cols-2 gap-2 pt-1">
          <Link
            href="/partner-app/escalations"
            className="p-3 rounded-2xl bg-red-600 text-white font-bold text-xs flex items-center justify-between shadow-sm hover:bg-red-700 transition-colors"
          >
            <span>Resolve Escalations →</span>
            <AlertTriangle className="w-4 h-4" />
          </Link>
          <Link
            href="/partner-app/fleet"
            className="p-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-between shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <span>Fleet & KYC Review →</span>
            <Users className="w-4 h-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
