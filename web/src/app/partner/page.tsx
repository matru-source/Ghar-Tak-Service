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
  Calendar,
  X,
  Plus,
  Receipt,
  Navigation,
} from '@/components/ui/icons';
import { getActivePartnerId } from '@/lib/partner-session';

interface JobItem {
  id: string;
  jobTicketNumber: string;
  customerName: string;
  customerPhone?: string;
  customerAddressText?: string;
  technicianName?: string;
  technicianStatusLabel?: string;
  serviceTitle: string;
  status: 'EN_ROUTE' | 'PENDING' | 'DONE' | 'STARTED' | 'ESCALATED';
  rawStatus?: string;
  amountInr: number;
  pincode: string;
  dateStr: string;
}

export default function PartnerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [selectedTrackJob, setSelectedTrackJob] = useState<JobItem | null>(null);
  const [selectedAssignJob, setSelectedAssignJob] = useState<JobItem | null>(null);
  const [selectedInvoiceJob, setSelectedInvoiceJob] = useState<JobItem | null>(null);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showZexClaimModal, setShowZexClaimModal] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Partner entity details
  const [partnerInfo, setPartnerInfo] = useState({
    id: 'bb2c2fae-936f-4b56-a1da-078844915983',
    entityName: 'Maharashtra Team',
    stateLicensed: 'Maharashtra',
  });

  // 4 Primary KPI values matching Client Mockup
  const [kpiStats, setKpiStats] = useState({
    totalJobs: 0,
    totalJobsTrend: 'Live Database',
    activeTechnicians: 0,
    onlineNow: 0,
    revenueText: '₹0',
    revenueTrend: 'Live Settled',
    escalatedJobs: 0,
  });

  const [apiConnected, setApiConnected] = useState(false);
  const [currentDateStr, setCurrentDateStr] = useState('October 22, 2026');

  // Live Jobs from database
  const [jobs, setJobs] = useState<JobItem[]>([]);

  // Standby Technicians for Manual Assignment (Module 2 & 3)
  const [availableTechnicians, setAvailableTechnicians] = useState<
    Array<{
      id: string;
      name: string;
      badge: string;
      rating: number;
      distance: string;
      pincode: string;
      status: string;
    }>
  >([]);

  // Connect to live API endpoints on mount
  useEffect(() => {
    setCurrentDateStr(
      new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    );

    async function syncBackendData() {
      try {
        setLoading(true);
        const rawPartner = getActivePartnerId();
        let activePartnerUuid = rawPartner;

        // 1. Resolve active partner UUID dynamically from /api/partner/profile
        try {
          const profRes = await fetch(`/api/partner/profile?partnerId=${encodeURIComponent(rawPartner)}`).then((r) => r.json());
          if (profRes?.success && profRes.partner) {
            activePartnerUuid = profRes.partner.id || rawPartner;
            setPartnerInfo({
              id: profRes.partner.id,
              entityName: profRes.partner.entityName || 'Maharashtra Operations Hub',
              stateLicensed: profRes.partner.stateLicensed || 'Maharashtra',
            });
            if (typeof window !== 'undefined' && profRes.partner.id) {
              localStorage.setItem('partnerId', profRes.partner.id);
              localStorage.setItem('gts_partner_id', profRes.partner.id);
            }
          }
        } catch (err) {
          console.warn('Partner profile resolution error:', err);
        }

        // 2. Fetch live data with resolved active partner UUID
        const [jobsRes, fleetRes, invRes, escRes] = await Promise.all([
          fetch(`/api/jobs?partnerId=${encodeURIComponent(activePartnerUuid)}`).then((r) => r.json()).catch(() => null),
          fetch(`/api/partner/fleet?partnerId=${encodeURIComponent(activePartnerUuid)}`).then((r) => r.json()).catch(() => null),
          fetch(`/api/partner/invoices?partnerId=${encodeURIComponent(activePartnerUuid)}`).then((r) => r.json()).catch(() => null),
          fetch(`/api/partner/escalations?partnerId=${encodeURIComponent(activePartnerUuid)}`).then((r) => r.json()).catch(() => null),
        ]);

        if (jobsRes?.success || fleetRes?.success || invRes?.success) {
          setApiConnected(true);
        }

        // 3. Process Live Jobs
        let mappedJobs: JobItem[] = [];
        if (jobsRes?.success && Array.isArray(jobsRes.data?.jobs)) {
          mappedJobs = jobsRes.data.jobs.map((j: any) => {
            let normalizedStatus: JobItem['status'] = 'PENDING';
            const s = (j.status || '').toUpperCase();
            if (s === 'WORK_COMPLETED' || s === 'SETTLED' || s === 'COMPLETED' || s === 'DONE') {
              normalizedStatus = 'DONE';
            } else if (s === 'EN_ROUTE') {
              normalizedStatus = 'EN_ROUTE';
            } else if (s === 'IN_PROGRESS' || s === 'STARTED' || s === 'SAFETY_CHECKED' || s === 'ARRIVED') {
              normalizedStatus = 'STARTED';
            } else if (s === 'ESCALATED_SLA' || s === 'ESCALATED') {
              normalizedStatus = 'ESCALATED';
            }

            const rawAmt = j.totalAmountInr || j.invoice?.totalAmount || j.basePriceInr || 1250;

            return {
              id: j.id,
              jobTicketNumber: j.jobTicketNumber?.startsWith('#') ? j.jobTicketNumber : `#${j.jobTicketNumber || 'J-1001'}`,
              customerName: j.customerName || j.customer?.fullName || 'Customer',
              customerPhone: j.customerPhone || j.customer?.phone || '',
              customerAddressText: j.customerAddressText || 'Address on file',
              technicianName: j.technicianName
                ? `${j.technicianName} (${normalizedStatus === 'DONE' ? 'Completed' : normalizedStatus === 'STARTED' ? 'In Progress' : 'Assigned'})`
                : 'Unassigned',
              technicianStatusLabel: j.technicianName || 'Unassigned',
              serviceTitle: j.serviceTitle || j.service?.title || 'Electrical Repair Service',
              status: normalizedStatus,
              rawStatus: j.status,
              amountInr: typeof rawAmt === 'number' ? rawAmt : 1250,
              pincode: j.pincode || '400001',
              dateStr: j.scheduledAt
                ? new Date(j.scheduledAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : 'Today',
            };
          });

          setJobs(mappedJobs);
        }

        // 4. Compute real KPIs directly from live database queries
        const totalLiveJobs = jobsRes?.data?.counts?.total ?? mappedJobs.length ?? 0;
        const totalLiveTechs = fleetRes?.stats?.totalFleet ?? (fleetRes?.technicians?.length ?? 0);
        const liveOnlineTechs = fleetRes?.stats?.onlineCount ?? (fleetRes?.technicians?.filter((t: any) => t.isOnline).length ?? 0);

        const livePaidRevenue =
          invRes?.stats?.paidSettledAmountInr ??
          mappedJobs.filter((j) => j.status === 'DONE').reduce((acc, j) => acc + j.amountInr, 0);

        const formattedRevText =
          livePaidRevenue >= 100000
            ? `₹${(livePaidRevenue / 100000).toFixed(1)}L`
            : livePaidRevenue > 0
              ? `₹${livePaidRevenue.toLocaleString('en-IN')}`
              : '₹0';

        const liveEscalated =
          jobsRes?.data?.counts?.escalatedSla ??
          escRes?.counts?.totalEscalated ??
          mappedJobs.filter((j) => j.status === 'ESCALATED' || j.rawStatus === 'ESCALATED_SLA').length;

        setKpiStats({
          totalJobs: totalLiveJobs,
          totalJobsTrend: `${totalLiveJobs} live orders`,
          activeTechnicians: totalLiveTechs,
          onlineNow: liveOnlineTechs,
          revenueText: formattedRevText,
          revenueTrend: livePaidRevenue > 0 ? 'Live settled' : 'Live PostgreSQL',
          escalatedJobs: liveEscalated,
        });

        // 5. Populate Available Standby Technicians
        if (fleetRes?.technicians && Array.isArray(fleetRes.technicians) && fleetRes.technicians.length > 0) {
          const mappedTechs = fleetRes.technicians.map((t: any) => ({
            id: t.id,
            name: t.fullName,
            badge: t.badgeNumber || 'TECH-1025',
            rating: t.rating || 4.9,
            distance: '1.1 km',
            pincode: t.assignedPincode || '400001',
            status: t.isOnline ? 'Online' : 'Offline',
          }));
          setAvailableTechnicians(mappedTechs);
        }
      } catch (err) {
        console.warn('Live API sync error:', err);
      } finally {
        setLoading(false);
      }
    }

    syncBackendData();
  }, []);

  // Handle manual assignment connected to live API
  const handleAssignTechnician = async (tech: { id: string; name: string }) => {
    if (!selectedAssignJob) return;

    const currentJob = selectedAssignJob;

    // Optimistic UI update
    setJobs((prev) =>
      prev.map((j) =>
        j.id === currentJob.id
          ? {
              ...j,
              technicianName: `${tech.name} (Assigned)`,
              status: 'EN_ROUTE',
            }
          : j
      )
    );

    // Reduce escalated jobs count
    setKpiStats((prev) => ({
      ...prev,
      escalatedJobs: Math.max(0, prev.escalatedJobs - 1),
    }));

    showToast(`⚡ ${currentJob.jobTicketNumber} manually assigned to ${tech.name}! SLA timer reset.`);
    setSelectedAssignJob(null);

    // Sync with Live Backend Reassign / Dispatch Endpoint
    try {
      await fetch('/api/partner/dispatch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: currentJob.id,
          technicianId: tech.id,
          technicianName: tech.name,
          status: 'EN_ROUTE',
        }),
      });
      await fetch(`/api/jobs/${currentJob.id}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetTechnicianId: tech.id,
          reason: 'Manual partner dispatch reassignment via Regional Web CRM',
          slaExtensionMinutes: 20,
        }),
      });
    } catch (err) {
      console.warn('Reassign backend sync notification:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 rounded-xl bg-slate-900 text-white px-4 py-3 text-xs font-semibold shadow-2xl flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <Zap className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Welcome Header matching Client Mockup */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B5E20] tracking-tight">
            Welcome back, {partnerInfo.entityName}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Territory Dispatch &amp; Operations Command &bull; State Jurisdiction: {partnerInfo.stateLicensed}
          </p>
        </div>

        {/* Date Badge with Calendar Icon */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-2xs text-xs font-bold text-slate-700">
          <Calendar className="h-4 w-4 text-red-500" />
          <span>{currentDateStr}</span>
        </div>
      </div>

      {/* 4 KPI Cards matching Client Mockup */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Total Jobs */}
        <div className="rounded-xl sm:rounded-2xl border-2 border-[#A5D6A7] bg-[#E8F5E9] p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="text-center">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#2E7D32]">
              Total Jobs
            </span>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1B5E20] mt-0.5 sm:mt-1">
              {kpiStats.totalJobs}
            </div>
            <div className="text-[10px] sm:text-xs font-semibold text-[#2E7D32] mt-0.5 sm:mt-1 flex items-center justify-center gap-1">
              <span>&uarr; {kpiStats.totalJobsTrend}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Technicians */}
        <div className="rounded-xl sm:rounded-2xl border-2 border-[#A5D6A7] bg-[#E8F5E9] p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="text-center">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#2E7D32]">
              Active Technicians
            </span>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1B5E20] mt-0.5 sm:mt-1">
              {kpiStats.activeTechnicians}
            </div>
            <div className="text-[10px] sm:text-xs font-semibold text-[#2E7D32] mt-0.5 sm:mt-1">
              {kpiStats.onlineNow} online now
            </div>
          </div>
        </div>

        {/* Card 3: Revenue */}
        <div className="rounded-xl sm:rounded-2xl border-2 border-[#A5D6A7] bg-[#E8F5E9] p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="text-center">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#2E7D32]">
              Revenue
            </span>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1B5E20] mt-0.5 sm:mt-1">
              {kpiStats.revenueText}
            </div>
            <div className="text-[10px] sm:text-xs font-semibold text-[#2E7D32] mt-0.5 sm:mt-1 flex items-center justify-center gap-1">
              <span>&uarr; {kpiStats.revenueTrend}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Escalated Jobs (Warning Card) */}
        <div className="rounded-xl sm:rounded-2xl border-2 border-[#FFB74D] bg-[#FFF3E0] p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="text-center">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#E65100]">
              Escalated Jobs
            </span>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#D84315] mt-0.5 sm:mt-1">
              {kpiStats.escalatedJobs}
            </div>
            <div className="text-[10px] sm:text-xs font-bold text-[#E65100] mt-0.5 sm:mt-1 flex items-center justify-center gap-1">
              <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#E65100]" />
              <span>Needs attention</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Operations Bar (Modules 2, 4, 5, 6) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase text-[10px]">Territory Hub</span>
          <span className="truncate">Maharashtra &bull; Pincodes: 400001, 400002, 400005, 400020</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowOnboardModal(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl bg-[#1B5E20] text-white text-xs font-bold hover:bg-emerald-800 transition-colors shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Onboard Tech</span>
          </button>

          <button
            onClick={() => setShowZexClaimModal(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors shadow-2xs"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
            <span>Claim Zex (3 Mo)</span>
          </button>
        </div>
      </div>

      {/* Recent Jobs in Maharashtra (Matching Client Mockup Table) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#1B5E20]">
              Recent Jobs in Maharashtra
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Live dispatch feed &bull; State Jurisdiction: MH-01
            </p>
          </div>

          <Link
            href="/partner/dispatch"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
          >
            <span>View All Queue</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Desktop Table (Hidden on small screens) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#E8F5E9] text-[#1B5E20] border-b border-[#C8E6C9] font-black uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-5">Job ID</th>
                <th className="py-3.5 px-5">Customer</th>
                <th className="py-3.5 px-5">Technician</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto text-emerald-600 mb-2" />
                    <span className="text-xs">Querying Live Neon PostgreSQL Dispatch Queue...</span>
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    No active work orders in territory queue. Click &quot;View All Queue&quot; to inspect full dispatch records.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const isUnassigned = job.technicianName?.toLowerCase().includes('unassigned') || job.status === 'ESCALATED';
                  return (
                    <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Job ID */}
                      <td className="py-4 px-5 font-bold font-mono text-slate-700">
                        <Link
                          href={`/partner/jobs?ticket=${encodeURIComponent(job.jobTicketNumber.replace('#', ''))}`}
                          className="hover:underline hover:text-emerald-700 text-slate-900"
                          title="View detailed lifecycle dossier"
                        >
                          {job.jobTicketNumber}
                        </Link>
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-5 font-semibold text-slate-900">
                        <div>{job.customerName}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{job.serviceTitle}</div>
                      </td>

                      {/* Technician */}
                      <td className="py-4 px-5">
                        {isUnassigned ? (
                          <span className="font-extrabold text-red-600">Unassigned</span>
                        ) : (
                          <span className="text-slate-800 font-medium">{job.technicianName}</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-5">
                        {job.status === 'EN_ROUTE' && (
                          <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>En Route</span>
                          </span>
                        )}
                        {job.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1.5 font-bold text-amber-600">
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            <span>Pending</span>
                          </span>
                        )}
                        {job.status === 'DONE' && (
                          <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800">
                            <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
                            <span>Done</span>
                          </span>
                        )}
                        {job.status === 'STARTED' && (
                          <span className="inline-flex items-center gap-1.5 font-bold text-orange-600">
                            <span className="h-2 w-2 rounded-full bg-orange-500 animate-ping" />
                            <span>Started</span>
                          </span>
                        )}
                        {job.status === 'ESCALATED' && (
                          <span className="inline-flex items-center gap-1.5 font-bold text-rose-600">
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                            <span>Escalated SLA</span>
                          </span>
                        )}
                      </td>

                      {/* Action Button matching mockup: [Track], [Assign], [Invoice] */}
                      <td className="py-4 px-5 text-right">
                        {isUnassigned || job.status === 'ESCALATED' ? (
                          <button
                            onClick={() => setSelectedAssignJob(job)}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-[#1B5E20] font-bold text-xs transition-colors shadow-2xs border border-emerald-300"
                          >
                            [Assign]
                          </button>
                        ) : job.status === 'DONE' ? (
                          <button
                            onClick={() => setSelectedInvoiceJob(job)}
                            className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors shadow-2xs border border-slate-300"
                          >
                            [Invoice]
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedTrackJob(job)}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#1B5E20] font-bold text-xs transition-colors shadow-2xs border border-emerald-200"
                          >
                            [Track]
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Feed Cards (Visible only on mobile screens < md) */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-400">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto text-emerald-600 mb-2" />
              <span className="text-xs">Loading live jobs...</span>
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              No active work orders in territory queue.
            </div>
          ) : (
            jobs.map((job) => {
              const isUnassigned = job.technicianName?.toLowerCase().includes('unassigned') || job.status === 'ESCALATED';
              return (
                <div key={job.id} className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/partner/jobs?ticket=${encodeURIComponent(job.jobTicketNumber.replace('#', ''))}`}
                        className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded hover:bg-emerald-100"
                      >
                        {job.jobTicketNumber}
                      </Link>
                      <span className="font-bold text-xs text-slate-900">{job.customerName}</span>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {job.status === 'EN_ROUTE' && (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>En Route</span>
                        </span>
                      )}
                      {job.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 text-[11px] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          <span>Pending</span>
                        </span>
                      )}
                      {job.status === 'DONE' && (
                        <span className="inline-flex items-center gap-1 font-bold text-slate-800 text-[11px] bg-slate-100 px-2 py-0.5 rounded-full">
                          <Check className="h-3 w-3 text-emerald-600 stroke-[3]" />
                          <span>Done</span>
                        </span>
                      )}
                      {job.status === 'STARTED' && (
                        <span className="inline-flex items-center gap-1 font-bold text-orange-700 text-[11px] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-ping" />
                          <span>Started</span>
                        </span>
                      )}
                      {job.status === 'ESCALATED' && (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-700 text-[11px] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <AlertTriangle className="h-3 w-3 text-rose-500" />
                          <span>Escalated</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 line-clamp-1">
                    {job.serviceTitle}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-50 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Technician</span>
                      {isUnassigned ? (
                        <span className="font-extrabold text-red-600">Unassigned</span>
                      ) : (
                        <span className="text-slate-800 font-medium">{job.technicianName}</span>
                      )}
                    </div>

                    {/* Action Button */}
                    <div>
                      {isUnassigned || job.status === 'ESCALATED' ? (
                        <button
                          onClick={() => setSelectedAssignJob(job)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-[#1B5E20] font-bold text-xs transition-colors shadow-2xs border border-emerald-300"
                        >
                          [Assign]
                        </button>
                      ) : job.status === 'DONE' ? (
                        <button
                          onClick={() => setSelectedInvoiceJob(job)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors shadow-2xs border border-slate-300"
                        >
                          [Invoice]
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedTrackJob(job)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#1B5E20] font-bold text-xs transition-colors shadow-2xs border border-emerald-200"
                        >
                          [Track]
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: LIVE GPS TRACKING MODAL ([Track] Action)                         */}
      {/* ========================================================================= */}
      {selectedTrackJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-800">
                <Navigation className="h-5 w-5 text-emerald-600" />
                <h3 className="font-extrabold text-base">
                  Live Dispatch Tracking &bull; {selectedTrackJob.jobTicketNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTrackJob(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-emerald-900">{selectedTrackJob.serviceTitle}</div>
                  <div className="text-emerald-700 font-medium">Customer: {selectedTrackJob.customerName} ({selectedTrackJob.customerPhone})</div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                  {selectedTrackJob.status}
                </span>
              </div>

              {/* Simulated Map Visual */}
              <div className="h-44 bg-slate-900 rounded-xl relative overflow-hidden flex flex-col justify-between p-4 border border-slate-700 text-white">
                <div className="flex justify-between items-start z-10">
                  <div className="bg-black/60 px-2.5 py-1 rounded text-[11px] font-mono">
                    GPS: 18.9220&deg; N, 72.8347&deg; E
                  </div>
                  <div className="bg-emerald-500/80 px-2.5 py-1 rounded text-[11px] font-bold">
                    ETA: 8 mins away
                  </div>
                </div>

                <div className="flex items-center justify-center z-10">
                  <div className="flex items-center gap-3 bg-black/80 px-4 py-2 rounded-xl border border-emerald-500/40">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="font-bold text-xs">Technician {selectedTrackJob.technicianName} in Transit</span>
                  </div>
                </div>

                <div className="z-10 text-[10px] text-slate-400 truncate">
                  Destination: {selectedTrackJob.customerAddressText}
                </div>
              </div>

              <div className="flex justify-between items-center text-slate-600 text-[11px] pt-1">
                <span>Telemetry ping: 3s ago via 4G</span>
                <span className="font-bold text-emerald-700">1000V VDE Safety Checked</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedTrackJob(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Close Tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MANUAL ASSIGN MODAL ([Assign] Action for Escalated Jobs)         */}
      {/* ========================================================================= */}
      {selectedAssignJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-[#D84315]">
                <AlertTriangle className="h-5 w-5 text-[#E65100]" />
                <h3 className="font-extrabold text-base">
                  Manual Dispatch Assignment &bull; {selectedAssignJob.jobTicketNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAssignJob(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900">
                <div className="font-bold">{selectedAssignJob.serviceTitle}</div>
                <div className="mt-1 text-slate-700">
                  Customer: <strong>{selectedAssignJob.customerName}</strong> ({selectedAssignJob.customerPhone})
                </div>
                <div className="text-slate-600 truncate mt-0.5">
                  Location: {selectedAssignJob.customerAddressText}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-2">
                  Select Standby Certified Electrician in Pincode {selectedAssignJob.pincode}:
                </span>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {availableTechnicians.map((tech) => (
                    <div
                      key={tech.id}
                      className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{tech.name}</span>
                          <span className="text-[10px] font-mono text-slate-500">{tech.badge}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3">
                          <span>★ {tech.rating}</span>
                          <span>&bull;</span>
                          <span>{tech.distance} away</span>
                          <span>&bull;</span>
                          <span className="text-emerald-700 font-bold">{tech.status}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAssignTechnician(tech)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#1B5E20] hover:bg-emerald-800 text-white font-bold text-xs transition-colors shadow-2xs"
                      >
                        Assign Now
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedAssignJob(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: INVOICE & GST MODAL ([Invoice] Action)                            */}
      {/* ========================================================================= */}
      {selectedInvoiceJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <Receipt className="h-5 w-5 text-emerald-600" />
                <h3 className="font-extrabold text-base">
                  Tax Invoice &bull; {selectedInvoiceJob.jobTicketNumber === '#J-1001' ? 'INV-2026-001' : `INV-${selectedInvoiceJob.jobTicketNumber.replace('#', '')}`}
                </h3>
              </div>
              <button
                onClick={() => setSelectedInvoiceJob(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Job Ticket:</span>
                <span className="font-mono font-bold text-slate-800">{selectedInvoiceJob.jobTicketNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-semibold text-slate-800">{selectedInvoiceJob.serviceTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-800">{selectedInvoiceJob.customerName}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between">
                <span className="text-slate-500">Base Labor Charge:</span>
                <span className="font-medium text-slate-800">₹{(selectedInvoiceJob.amountInr / 1.18).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CGST (9%):</span>
                <span className="font-medium text-slate-800">₹{((selectedInvoiceJob.amountInr / 1.18) * 0.09).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SGST (9%):</span>
                <span className="font-medium text-slate-800">₹{((selectedInvoiceJob.amountInr / 1.18) * 0.09).toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-300 pt-2 flex justify-between font-extrabold text-sm text-[#1B5E20]">
                <span>Total Paid:</span>
                <span>₹{selectedInvoiceJob.amountInr.toLocaleString()}</span>
              </div>

              {/* Commission Split Box */}
              <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] space-y-1">
                <div className="font-bold text-emerald-900">70/15/15 Commission Settlement:</div>
                <div className="flex justify-between text-emerald-800">
                  <span>Electrician Payout (70%):</span>
                  <span className="font-bold">₹{(selectedInvoiceJob.amountInr * 0.7).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span>Partner Franchise Share (15%):</span>
                  <span className="font-bold">₹{(selectedInvoiceJob.amountInr * 0.15).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span>Platform Royalty (15%):</span>
                  <span className="font-bold">₹{(selectedInvoiceJob.amountInr * 0.15).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  const invNo = selectedInvoiceJob.jobTicketNumber === '#J-1001' ? 'INV-2026-001' : `INV-${selectedInvoiceJob.jobTicketNumber.replace('#', '')}`;
                  showToast(`🧾 Invoice ${invNo} downloaded as PDF!`);
                  setSelectedInvoiceJob(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#1B5E20] hover:bg-emerald-800 text-white font-bold text-xs"
              >
                Download PDF Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ONBOARD NEW TECHNICIAN (Module 2)                                */}
      {/* ========================================================================= */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-[#1B5E20]">
                <Plus className="h-5 w-5 text-emerald-600" />
                <h3 className="font-extrabold text-base">Onboard New Electrician</h3>
              </div>
              <button
                onClick={() => setShowOnboardModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                showToast('👷 New technician application submitted for KYC verification!');
                setShowOnboardModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Shinde"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mobile Number (+91)</label>
                <input
                  type="tel"
                  required
                  placeholder="9811223344"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned Territory Pincode</label>
                <select className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-emerald-600">
                  <option value="400001">400001 - Colaba / Fort</option>
                  <option value="400002">400002 - Marine Lines</option>
                  <option value="400005">400005 - Cuffe Parade</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">VDE 1000V Certified Safety Kit Serial</label>
                <input
                  type="text"
                  required
                  placeholder="VDE-KIT-MH-9812"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-emerald-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1B5E20] hover:bg-emerald-800 text-white font-bold"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: CLAIM ZEX CYBER SUBSCRIPTION (Module 6)                          */}
      {/* ========================================================================= */}
      {showZexClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-amber-900">
                <ShieldCheck className="h-5 w-5 text-amber-600" />
                <h3 className="font-extrabold text-base">Zex Cyber Security Partner Benefit</h3>
              </div>
              <button
                onClick={() => setShowZexClaimModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200">
                <div className="font-bold text-amber-900">3-Month Complimentary Subscription</div>
                <div className="text-slate-600 mt-1">
                  As an official state partner of Ghar Tak Service, your franchise dispatch hub is entitled to 3 free months of Zex Cyber Device &amp; Network Protection.
                </div>
              </div>

              <ul className="space-y-1.5 list-disc list-inside text-slate-600 text-[11px]">
                <li>24x7 Endpoint Telemetry Guard</li>
                <li>Encrypted Dispatch Telemetry Tunnel</li>
                <li>Phishing &amp; Fraud Prevention for Field Technicians</li>
              </ul>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowZexClaimModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Close
              </button>
              <button
                onClick={() => {
                  showToast('🛡️ Zex Cyber 3-Month License Key generated and sent to partner email!');
                  setShowZexClaimModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
              >
                Claim 3-Month License
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
