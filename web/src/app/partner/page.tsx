'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap,
  Users,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  Phone,
  MapPin,
  Wrench,
  Check,
} from '@/components/ui/icons';

interface PartnerTelemetry {
  partner: {
    id: string;
    entityName: string;
    directorName: string;
    email: string;
    phone: string;
    gstin: string;
    stateLicensed: string;
    partnerRevenueSharePct: number;
    activePincodesCount: number;
    maxPincodeQuota: number;
    activeTechnicianCount: number;
  };
  kpis: {
    totalActiveJobs: number;
    escalatedJobsCount: number;
    totalFleetCount: number;
    onlineFleetCount: number;
    averageResponseTimeMinutes: number;
    slaComplianceRatePct: number;
    partnerCommissionRatePct: number;
    totalPartnerShareEarnedInr: number;
    activePincodesCount: number;
    maxPincodeQuota: number;
  };
  activeJobs: Array<{
    id: string;
    jobTicketNumber: string;
    customerName: string;
    customerPhone: string;
    technicianName?: string;
    serviceTitle: string;
    pincode: string;
    customerAddressText: string;
    status: string;
    priority: string;
    handoverOtp?: string;
    totalAmountInr: number;
    scheduledAt: string;
    safetyGlovesConfirmed: boolean;
  }>;
  onlineTechnicians: Array<{
    id: string;
    badgeNumber: string;
    fullName: string;
    phone: string;
    rating: number;
    totalJobsCompleted: number;
    isOnline: boolean;
    assignedPincode: string;
    kycStatus: string;
    insulatedGlovesVerified: boolean;
  }>;
  allHubTechnicians: Array<{
    id: string;
    badgeNumber: string;
    fullName: string;
    phone: string;
    rating: number;
    totalJobsCompleted: number;
    isOnline: boolean;
    assignedPincode: string;
    kycStatus: string;
    insulatedGlovesVerified: boolean;
  }>;
  recentLedgers: Array<{
    id: string;
    transactionReference: string;
    jobTicketNumber?: string;
    ledgerType: string;
    entryDirection: string;
    amountInr: number;
    narrative: string;
    createdAt: string;
  }>;
}

export default function PartnerDashboardPage() {
  const [data, setData] = useState<PartnerTelemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [reassignSuccessMsg, setReassignSuccessMsg] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);

  const fetchTelemetry = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/partner/telemetry');
      const json = await res.json();
      if (json.success) {
        setData(json.telemetry);
      }
    } catch (err) {
      console.error('Error fetching partner telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const handleQuickReassign = async () => {
    try {
      setIsReassigning(true);
      // Trigger proximity reassignment logic
      const res = await fetch('/api/admin/escalations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: 'job_1005',
          reassignTechnicianId: 'tech_pradeep_04',
          reason: 'Manual Partner Dispatcher Override: Colaba Hub stand-by assignment',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setReassignSuccessMsg('Job #J-1005 successfully reassigned to standby technician Pradeep Jadhav!');
        await fetchTelemetry();
        setTimeout(() => setReassignSuccessMsg(''), 5000);
      }
    } catch (err) {
      console.error('Error executing quick reassign:', err);
    } finally {
      setIsReassigning(false);
    }
  };

  const partner = data?.partner;
  const kpis = data?.kpis;
  const activeJobs = data?.activeJobs || [];
  const allTechs = data?.allHubTechnicians || [];
  const ledgers = data?.recentLedgers || [];

  return (
    <div className="space-y-6">
      {/* Screen Title & Top Navigation Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            <Zap className="h-4 w-4" />
            <span>PTNR-SCR-01 &bull; Franchise Regional Command Center</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            {partner?.entityName || 'Maharashtra Tier-1 Operations Hub'}
          </h1>
          <p className="text-sm text-slate-500">
            Regional territory dispatch feed, real-time electrician standby roster &amp; 30-min SLA health index.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTelemetry}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Hub Feed
          </button>
        </div>
      </div>

      {reassignSuccessMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{reassignSuccessMsg}</span>
        </div>
      )}

      {/* Critical SLA Breach Emergency Alert Banner (PTNR-SCR-01) */}
      {kpis && kpis.escalatedJobsCount > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="rounded-xl bg-rose-100 p-2.5 text-rose-600 shrink-0">
                <AlertTriangle className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">
                    CRITICAL SLA BREACH ALERT &bull; JOB #J-1005
                  </span>
                  <span className="rounded-full bg-rose-200 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-rose-800 font-bold">
                    Action Needed
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-1">
                  30-minute arrival window breached in Colaba Market quadrant. Standby certified electrician available at 1.15km.
                </p>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-1 font-mono">
                  <span>Customer: Amit Sharma (+919876543213)</span>
                  <span>Target: Circuit Breaker Diagnostic</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={handleQuickReassign}
                disabled={isReassigning}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 transition-colors shadow-sm disabled:opacity-50"
              >
                {isReassigning ? 'Reassigning Fleet...' : 'Dispatch Standby Technician'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Territory Work Orders</span>
            <Wrench className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {kpis?.totalActiveJobs ?? '...'}
            </span>
            <span className="text-xs font-semibold text-rose-600">
              ({kpis?.escalatedJobsCount || 0} escalated)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Colaba 400001 &amp; Mumbai Central sector
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Online Fleet Ready</span>
            <Users className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">
              {kpis?.onlineFleetCount ?? '...'} / {kpis?.totalFleetCount ?? '...'}
            </span>
            <span className="text-xs font-semibold text-emerald-600">Active</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
            <CheckCircle2 className="h-3 w-3" />
            100% Insulated Safety Gloves Certified
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Avg Response Time</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {kpis?.averageResponseTimeMinutes ?? 11.4} min
            </span>
            <span className="text-xs font-semibold text-emerald-600">&lt; 30-min Target</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            SLA Compliance Rate: <strong className="text-emerald-700">{kpis?.slaComplianceRatePct ?? 98.2}%</strong>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Franchise Share (15.0%)</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-emerald-700">
              ₹{(kpis?.totalPartnerShareEarnedInr || 158.90).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Directly escrowed for weekly payout settlement
          </div>
        </div>
      </div>

      {/* Main Grid: Active Orders & Standby Fleet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Territory Dispatch Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Territory Dispatch Queue</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 font-mono">
                  {activeJobs.length} active
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time work orders executing within Maharashtra postal jurisdiction.
              </p>
            </div>
            <Link
              href="/partner/dispatch"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View Full Queue</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {activeJobs.map((job) => {
              const isEscalated = job.status === 'ESCALATED_SLA';
              const isInProgress = job.status === 'IN_PROGRESS';

              return (
                <div
                  key={job.id}
                  className={`rounded-2xl border p-4.5 transition-all shadow-xs ${
                    isEscalated
                      ? 'border-rose-200 bg-rose-50/60'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {job.jobTicketNumber}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isEscalated
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-sky-100 text-sky-700 border border-sky-200'
                        }`}
                      >
                        {job.status.replace('_', ' ')}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600">
                        PIN: {job.pincode}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-slate-500">Total:</span>
                      <span className="font-bold text-slate-900">
                        ₹{job.totalAmountInr.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-[11px] text-slate-400 uppercase font-semibold">Service Offer</div>
                      <div className="font-bold text-slate-900 mt-0.5">{job.serviceTitle}</div>
                      <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                        <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{job.customerAddressText}</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] text-slate-400 uppercase font-semibold">Assigned Fleet</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Wrench className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span className="font-bold text-slate-900">
                          {job.technicianName || 'Unassigned (Standby)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-1">
                        <span>Customer: {job.customerName}</span>
                        {job.handoverOtp && (
                          <span className="text-emerald-700 font-mono">
                            OTP: <strong>{job.handoverOtp}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Safety & Action footer */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-[11px]">
                      {job.safetyGlovesConfirmed ? (
                        <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                          <Check className="h-3 w-3" /> 1000V Gloves Verified
                        </span>
                      ) : (
                        <span className="text-amber-700 flex items-center gap-1 font-semibold">
                          <AlertTriangle className="h-3 w-3" /> Safety Checklist Pending
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href="/partner/dispatch"
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
                      >
                        Inspect Lifecycle
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Regional Fleet Standby & Ledger Highlights */}
        <div className="space-y-6">
          {/* Fleet Standby Roster */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Regional Fleet Roster</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    {kpis?.onlineFleetCount || 0} Online
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Maharashtra Hub certified electricians.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 font-medium">
              {allTechs.slice(0, 4).map((tech) => (
                <div key={tech.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${tech.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className="font-bold text-slate-900">{tech.fullName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({tech.badgeNumber})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 ml-3.5 mt-0.5">
                      Pincode: <span className="font-mono text-slate-700">{tech.assignedPincode}</span> &bull; {tech.totalJobsCompleted} jobs
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-amber-500 text-xs">
                      ★ {tech.rating}
                    </div>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        tech.kycStatus === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {tech.kycStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/partner/fleet"
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
            >
              Manage Fleet Roster &rarr;
            </Link>
          </div>

          {/* Partner Revenue & Escrow Snippet */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Regional Settlement Ledger
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  15% Hub Commission per Work Order
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {ledgers.length > 0 ? (
                ledgers.map((l) => (
                  <div key={l.id} className="rounded-xl bg-slate-50 p-2.5 border border-slate-200/80">
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-slate-500 text-[10px]">{l.transactionReference}</span>
                      <span className="font-bold text-emerald-700">
                        +₹{l.amountInr.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 truncate">
                      {l.narrative}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200/80">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-500 text-[10px]">TXN-2026-00104</span>
                    <span className="font-bold text-emerald-700">+₹158.90</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Maharashtra Operations Hub Regional Share (15.0% of Base Labor ₹1,059.32)
                  </p>
                </div>
              )}
            </div>

            <Link
              href="/partner/finance"
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
            >
              View Invoices &amp; Payouts &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
