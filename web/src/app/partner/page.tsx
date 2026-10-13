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

interface JobItem {
  id: string;
  jobTicketNumber: string;
  customerName: string;
  customerPhone?: string;
  customerAddressText?: string;
  technicianName?: string;
  technicianStatusLabel?: string;
  serviceTitle: string;
  status: 'EN_ROUTE' | 'PENDING' | 'DONE' | 'STARTED';
  amountInr: number;
  pincode: string;
  dateStr: string;
}

export default function PartnerDashboardPage() {
  const [loading, setLoading] = useState(false);
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

  // 4 Primary KPI values matching Client Mockup
  const [kpiStats, setKpiStats] = useState({
    totalJobs: 284,
    totalJobsTrend: '12% this week',
    activeTechnicians: 18,
    onlineNow: 8,
    revenueText: '₹4.2L',
    revenueTrend: '8% this month',
    escalatedJobs: 3,
  });

  const [apiConnected, setApiConnected] = useState(false);

  // Recent Jobs matching Client Mockup
  const [jobs, setJobs] = useState<JobItem[]>([
    {
      id: 'job_1001',
      jobTicketNumber: '#J-1001',
      customerName: 'Amit S.',
      customerPhone: '+91 98765 43210',
      customerAddressText: '45, Park Avenue, Colaba, Mumbai - 400001',
      technicianName: 'Rajesh (Assigned)',
      technicianStatusLabel: 'Rajesh',
      serviceTitle: 'Fan Installation & Regulator Replacement',
      status: 'EN_ROUTE',
      amountInr: 1250,
      pincode: '400001',
      dateStr: 'August 27, 2026',
    },
    {
      id: 'job_1002',
      jobTicketNumber: '#J-1002',
      customerName: 'Priya M.',
      customerPhone: '+91 98201 55412',
      customerAddressText: '12, Marine Drive Chambers, Mumbai - 400002',
      technicianName: 'Unassigned',
      serviceTitle: 'Emergency AC Main Circuit Tripping',
      status: 'PENDING',
      amountInr: 1850,
      pincode: '400002',
      dateStr: 'August 27, 2026',
    },
    {
      id: 'job_1003',
      jobTicketNumber: '#J-1003',
      customerName: 'Vikram R.',
      customerPhone: '+91 98334 11223',
      customerAddressText: 'Flat 402, Sea Crest Towers, Mumbai - 400001',
      technicianName: 'Suresh (Completed)',
      serviceTitle: 'Full Home MCB Panel Replacement',
      status: 'DONE',
      amountInr: 2499,
      pincode: '400001',
      dateStr: 'August 27, 2026',
    },
    {
      id: 'job_1004',
      jobTicketNumber: '#J-1004',
      customerName: 'Neha K.',
      customerPhone: '+91 98112 99887',
      customerAddressText: 'Shop 7, Colaba Causeway, Mumbai - 400001',
      technicianName: 'Ankit (In Progress)',
      serviceTitle: 'Commercial Wiring Diagnostic & Earthing Fix',
      status: 'STARTED',
      amountInr: 1450,
      pincode: '400001',
      dateStr: 'August 27, 2026',
    },
  ]);

  // Standby Technicians for Manual Assignment (Module 2 & 3)
  const [availableTechnicians, setAvailableTechnicians] = useState([
    { id: 'tech_suresh_01', name: 'Suresh Patil', badge: 'TECH-1025', rating: 4.9, distance: '0.8 km', pincode: '400001', status: 'Online' },
    { id: 'tech_rajesh_01', name: 'Rajesh Kumar', badge: 'TECH-1024', rating: 4.8, distance: '1.2 km', pincode: '400001', status: 'Online' },
    { id: 'tech_pradeep_04', name: 'Pradeep Jadhav', badge: 'TECH-1028', rating: 4.7, distance: '1.5 km', pincode: '400002', status: 'Online' },
    { id: 'tech_ankit_02', name: 'Ankit Verma', badge: 'TECH-1026', rating: 4.8, distance: '2.1 km', pincode: '400001', status: 'Online' },
  ]);

  // Connect to live API endpoints on mount
  useEffect(() => {
    async function syncBackendData() {
      try {
        const [fleetRes, escRes] = await Promise.all([
          fetch('/api/partner/fleet?partnerId=ptnr_mah_01').then((r) => r.json()).catch(() => null),
          fetch('/api/partner/escalations?partnerId=ptnr_mah_01').then((r) => r.json()).catch(() => null),
        ]);

        if (fleetRes?.success) {
          setApiConnected(true);
          if (fleetRes.technicians && fleetRes.technicians.length > 0) {
            const onlineTechs = fleetRes.technicians
              .filter((t: any) => t.isOnline)
              .map((t: any) => ({
                id: t.id,
                name: t.fullName,
                badge: t.badgeNumber,
                rating: t.rating || 4.8,
                distance: '1.1 km',
                pincode: t.assignedPincode || '400001',
                status: 'Online',
              }));
            if (onlineTechs.length > 0) {
              setAvailableTechnicians(onlineTechs);
            }
          }
        }

        if (escRes?.success && escRes.counts) {
          setKpiStats((prev) => ({
            ...prev,
            escalatedJobs: escRes.counts.totalEscalated ?? prev.escalatedJobs,
          }));
        }
      } catch (err) {
        console.warn('Live API connection check:', err);
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

    // Sync with Live Backend Reassign Endpoint
    try {
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
            Welcome back, Maharashtra Team!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Territory Dispatch &amp; Operations Command &bull; State Jurisdiction: Maharashtra
          </p>
        </div>

        {/* Date Badge with Calendar Icon */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-2xs text-xs font-bold text-slate-700">
          <Calendar className="h-4 w-4 text-red-500" />
          <span>August 27, 2026</span>
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
            href="/partner/jobs"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
          >
            <span>View All</span>
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
              {jobs.map((job) => {
                const isUnassigned = job.technicianName?.toLowerCase().includes('unassigned');
                return (
                  <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Job ID */}
                    <td className="py-4 px-5 font-bold font-mono text-slate-700">
                      {job.jobTicketNumber}
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
                    </td>

                    {/* Action Button matching mockup: [Track], [Assign], [Invoice] */}
                    <td className="py-4 px-5 text-right">
                      {isUnassigned ? (
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
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Feed Cards (Visible only on mobile screens < md) */}
        <div className="md:hidden divide-y divide-slate-100">
          {jobs.map((job) => {
            const isUnassigned = job.technicianName?.toLowerCase().includes('unassigned');
            return (
              <div key={job.id} className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {job.jobTicketNumber}
                    </span>
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
                    {isUnassigned ? (
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
          })}
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
                  Tax Invoice &bull; INV-MH-2026-003
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
                  showToast('🧾 Invoice INV-MH-2026-003 downloaded as PDF!');
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
