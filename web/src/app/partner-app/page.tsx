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
  serviceTitle: string;
  status: 'EN_ROUTE' | 'PENDING' | 'DONE' | 'STARTED';
  amountInr: number;
  pincode: string;
}

export default function PartnerAppOverviewPage() {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal states
  const [selectedTrackJob, setSelectedTrackJob] = useState<JobItem | null>(null);
  const [selectedAssignJob, setSelectedAssignJob] = useState<JobItem | null>(null);
  const [selectedInvoiceJob, setSelectedInvoiceJob] = useState<JobItem | null>(null);
  const [showZexClaimModal, setShowZexClaimModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
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

  // Recent Jobs matching Client Mockup
  const [jobs, setJobs] = useState<JobItem[]>([
    {
      id: 'job_1001',
      jobTicketNumber: '#J-1001',
      customerName: 'Amit S.',
      customerPhone: '+91 98765 43210',
      customerAddressText: '45, Park Avenue, Colaba, Mumbai - 400001',
      technicianName: 'Rajesh (Assigned)',
      serviceTitle: 'Fan Installation & Regulator Fix',
      status: 'EN_ROUTE',
      amountInr: 1250,
      pincode: '400001',
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
    },
    {
      id: 'job_1004',
      jobTicketNumber: '#J-1004',
      customerName: 'Neha K.',
      customerPhone: '+91 98112 99887',
      customerAddressText: 'Shop 7, Colaba Causeway, Mumbai - 400001',
      technicianName: 'Ankit (In Progress)',
      serviceTitle: 'Commercial Wiring Diagnostic',
      status: 'STARTED',
      amountInr: 1450,
      pincode: '400001',
    },
  ]);

  const availableTechnicians = [
    { id: 'tech_suresh_01', name: 'Suresh Patil', badge: 'TECH-1025', rating: 4.9, distance: '0.8 km' },
    { id: 'tech_rajesh_01', name: 'Rajesh Kumar', badge: 'TECH-1024', rating: 4.8, distance: '1.2 km' },
    { id: 'tech_pradeep_04', name: 'Pradeep Jadhav', badge: 'TECH-1028', rating: 4.7, distance: '1.5 km' },
    { id: 'tech_ankit_02', name: 'Ankit Verma', badge: 'TECH-1026', rating: 4.8, distance: '2.1 km' },
  ];

  const handleAssignTechnician = (techName: string) => {
    if (!selectedAssignJob) return;

    setJobs((prev) =>
      prev.map((j) =>
        j.id === selectedAssignJob.id
          ? {
              ...j,
              technicianName: `${techName} (Assigned)`,
              status: 'EN_ROUTE',
            }
          : j
      )
    );

    setKpiStats((prev) => ({
      ...prev,
      escalatedJobs: Math.max(0, prev.escalatedJobs - 1),
    }));

    showToast(`⚡ ${selectedAssignJob.jobTicketNumber} assigned to ${techName}!`);
    setSelectedAssignJob(null);
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 text-slate-900 pb-16 select-none relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen Header matching Client Mockup */}
      <header className="sticky top-0 z-30 bg-[#1B5E20] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-bold text-amber-300">
            ⚡
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-sm text-white tracking-tight truncate">
              ElectricCare | Partner Portal
            </h1>
            <p className="text-[10px] text-emerald-200">Maharashtra Regional Hub</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowZexClaimModal(true)}
            className="px-2 py-1 rounded-md bg-amber-400 text-amber-950 font-extrabold text-[10px] shadow-2xs"
          >
            🛡️ Zex (3Mo)
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="px-3.5 pt-3 space-y-3.5">
        {/* Welcome Greeting & Date matching Client Mockup */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-[#1B5E20] leading-tight">
              Welcome back, Maharashtra Team!
            </h2>
            <p className="text-[11px] text-slate-500">Live Territory Dispatch Console</p>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-red-500" />
            <span>Aug 27, 2026</span>
          </div>
        </div>

        {/* 4 KPI Cards matching Client Mockup */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Card 1: Total Jobs */}
          <div className="rounded-xl border-2 border-[#A5D6A7] bg-[#E8F5E9] p-3 shadow-2xs text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E7D32]">
              Total Jobs
            </span>
            <div className="text-2xl font-black text-[#1B5E20] my-0.5">
              {kpiStats.totalJobs}
            </div>
            <div className="text-[10px] font-bold text-[#2E7D32]">
              &uarr; {kpiStats.totalJobsTrend}
            </div>
          </div>

          {/* Card 2: Active Technicians */}
          <div className="rounded-xl border-2 border-[#A5D6A7] bg-[#E8F5E9] p-3 shadow-2xs text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E7D32]">
              Active Technicians
            </span>
            <div className="text-2xl font-black text-[#1B5E20] my-0.5">
              {kpiStats.activeTechnicians}
            </div>
            <div className="text-[10px] font-bold text-[#2E7D32]">
              {kpiStats.onlineNow} online now
            </div>
          </div>

          {/* Card 3: Revenue */}
          <div className="rounded-xl border-2 border-[#A5D6A7] bg-[#E8F5E9] p-3 shadow-2xs text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E7D32]">
              Revenue
            </span>
            <div className="text-2xl font-black text-[#1B5E20] my-0.5">
              {kpiStats.revenueText}
            </div>
            <div className="text-[10px] font-bold text-[#2E7D32]">
              &uarr; {kpiStats.revenueTrend}
            </div>
          </div>

          {/* Card 4: Escalated Jobs */}
          <div className="rounded-xl border-2 border-[#FFB74D] bg-[#FFF3E0] p-3 shadow-2xs text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E65100]">
              Escalated Jobs
            </span>
            <div className="text-2xl font-black text-[#D84315] my-0.5">
              {kpiStats.escalatedJobs}
            </div>
            <div className="text-[10px] font-bold text-[#E65100] flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3 text-[#E65100]" />
              <span>Needs attention</span>
            </div>
          </div>
        </div>

        {/* Section: Recent Jobs in Maharashtra */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-3.5 py-2.5 bg-[#E8F5E9] border-b border-[#C8E6C9] flex items-center justify-between">
            <h3 className="font-extrabold text-xs text-[#1B5E20] uppercase tracking-wider">
              Recent Jobs in Maharashtra
            </h3>
            <span className="text-[10px] text-emerald-800 font-bold">Live Stream</span>
          </div>

          {/* Job Card List */}
          <div className="divide-y divide-slate-100">
            {jobs.map((job) => {
              const isUnassigned = job.technicianName?.toLowerCase().includes('unassigned');
              return (
                <div key={job.id} className="p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-800">
                        {job.jobTicketNumber}
                      </span>
                      <span className="text-xs font-semibold text-slate-900">&bull; {job.customerName}</span>
                    </div>

                    {/* Status Pill */}
                    <div>
                      {job.status === 'EN_ROUTE' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                          En Route
                        </span>
                      )}
                      {job.status === 'PENDING' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                          Pending
                        </span>
                      )}
                      {job.status === 'DONE' && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Done
                        </span>
                      )}
                      {job.status === 'STARTED' && (
                        <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-ping"></span>
                          Started
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 mt-1 truncate">
                    {job.serviceTitle}
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-50">
                    <div className="text-[11px]">
                      {isUnassigned ? (
                        <span className="font-black text-red-600">Unassigned</span>
                      ) : (
                        <span className="text-slate-700 font-medium">{job.technicianName}</span>
                      )}
                    </div>

                    {/* Action Button */}
                    <div>
                      {isUnassigned ? (
                        <button
                          onClick={() => setSelectedAssignJob(job)}
                          className="px-2.5 py-1 rounded-md bg-emerald-100 hover:bg-emerald-200 text-[#1B5E20] font-bold text-xs transition-colors border border-emerald-300"
                        >
                          [Assign]
                        </button>
                      ) : job.status === 'DONE' ? (
                        <button
                          onClick={() => setSelectedInvoiceJob(job)}
                          className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors border border-slate-300"
                        >
                          [Invoice]
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedTrackJob(job)}
                          className="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-[#1B5E20] font-bold text-xs transition-colors border border-emerald-200"
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
        </section>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: LIVE GPS TRACKING MODAL                                          */}
      {/* ========================================================================= */}
      {selectedTrackJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-extrabold text-sm text-emerald-900">
                Tracking &bull; {selectedTrackJob.jobTicketNumber}
              </span>
              <button onClick={() => setSelectedTrackJob(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-32 bg-slate-900 rounded-xl flex flex-col justify-between p-3 text-white text-xs">
              <div className="flex justify-between text-[10px]">
                <span>GPS: 18.9220&deg; N, 72.8347&deg; E</span>
                <span className="text-emerald-400 font-bold">8 mins away</span>
              </div>
              <div className="text-center font-bold text-xs">
                {selectedTrackJob.technicianName} en route to customer
              </div>
              <div className="text-[9px] text-slate-400 truncate">
                {selectedTrackJob.customerAddressText}
              </div>
            </div>

            <button
              onClick={() => setSelectedTrackJob(null)}
              className="w-full py-2 rounded-xl bg-slate-100 font-bold text-xs text-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MANUAL ASSIGN MODAL FOR ESCALATED JOBS                           */}
      {/* ========================================================================= */}
      {selectedAssignJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-extrabold text-sm text-[#D84315]">
                Manual Dispatch &bull; {selectedAssignJob.jobTicketNumber}
              </span>
              <button onClick={() => setSelectedAssignJob(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              <div className="font-bold text-amber-900">{selectedAssignJob.serviceTitle}</div>
              <div>Customer: {selectedAssignJob.customerName}</div>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              <span className="text-[11px] font-bold text-slate-800">Available Standby Electricians:</span>
              {availableTechnicians.map((t) => (
                <div
                  key={t.id}
                  className="p-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{t.name}</div>
                    <div className="text-[10px] text-slate-500">{t.distance} &bull; ★ {t.rating}</div>
                  </div>
                  <button
                    onClick={() => handleAssignTechnician(t.name)}
                    className="px-2.5 py-1 rounded bg-[#1B5E20] text-white font-bold text-xs"
                  >
                    Assign
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedAssignJob(null)}
              className="w-full py-2 rounded-xl bg-slate-100 font-bold text-xs text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: INVOICE MODAL                                                    */}
      {/* ========================================================================= */}
      {selectedInvoiceJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-extrabold text-sm text-slate-900">
                Invoice &bull; {selectedInvoiceJob.jobTicketNumber}
              </span>
              <button onClick={() => setSelectedInvoiceJob(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-bold">{selectedInvoiceJob.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-bold text-[#1B5E20]">₹{selectedInvoiceJob.amountInr}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>GST (18% Included):</span>
                <span>₹{(selectedInvoiceJob.amountInr * 0.18).toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 pt-1 flex justify-between text-[11px] font-bold text-emerald-800">
                <span>Partner Commission (15%):</span>
                <span>₹{(selectedInvoiceJob.amountInr * 0.15).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                showToast('🧾 Invoice downloaded as PDF!');
                setSelectedInvoiceJob(null);
              }}
              className="w-full py-2 rounded-xl bg-[#1B5E20] text-white font-bold text-xs"
            >
              Download PDF
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ZEX CYBER SUBSCRIPTION CLAIM                                     */}
      {/* ========================================================================= */}
      {showZexClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-extrabold text-sm text-amber-900">
                Zex Cyber Partner Benefit
              </span>
              <button onClick={() => setShowZexClaimModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-snug">
              Claim your <strong>3-Month Complimentary Subscription</strong> for encrypted telemetry channels, DDoS shielding, and fraud detection.
            </p>

            <button
              onClick={() => {
                showToast('🛡️ Zex Cyber 3-Month License Key generated!');
                setShowZexClaimModal(false);
              }}
              className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
            >
              Claim 3-Month License Key
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
