'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Zap,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Wrench,
  User,
  MapPin,
  Phone,
  Check,
  ChevronRight,
  TrendingUp,
} from '@/components/ui/icons';

interface JobDetail {
  id: string;
  jobTicketNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  technicianId?: string;
  technicianName?: string;
  serviceTitle: string;
  pincode: string;
  customerAddressText: string;
  status: string;
  priority: string;
  handoverOtp?: string;
  totalAmountInr: number;
  scheduledAt: string;
  slaExpiryAt?: string;
  safetyGlovesConfirmed: boolean;
  safetyMcbSwitchConfirmed: boolean;
  customerProfile?: {
    fullName: string;
    phone: string;
    email: string;
    activeSubscriptionPlan: string;
    totalOrdersCount: number;
    totalSpendInr: number;
  };
  technicianProfile?: {
    fullName: string;
    badgeNumber: string;
    rating: number;
    safetyKitSerial: string;
    insulatedGlovesVerified: boolean;
    totalJobsCompleted: number;
  };
  invoice?: {
    invoiceNumber: string;
    baseAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    totalAmount: number;
    paymentStatus: string;
  };
  slaTelemetry?: {
    remainingMinutes: number;
    isBreached: boolean;
    status: string;
  };
}

function PartnerJobDetailsContent() {
  const searchParams = useSearchParams();
  const ticketParam = searchParams.get('ticket') || 'J-1001';

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [otpInput, setOtpInput] = useState('');
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchJob = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const res = await fetch(`/api/partner/jobs/${ticketParam}`);
      const data = await res.json();
      if (data.success && data.job) {
        setJob(data.job);
      } else {
        setErrorMessage(data.error || 'Failed to load work order');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error fetching job');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [ticketParam]);

  const handleToggleSafety = async (field: 'gloves' | 'mcb') => {
    if (!job) return;
    try {
      const payload: any = {};
      if (field === 'gloves') payload.safetyGlovesConfirmed = !job.safetyGlovesConfirmed;
      if (field === 'mcb') payload.safetyMcbSwitchConfirmed = !job.safetyMcbSwitchConfirmed;

      const res = await fetch(`/api/partner/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(`Safety checklist updated and sealed in WORM audit trail!`);
        await fetchJob();
        setTimeout(() => setActionSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error toggling safety:', err);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !otpInput.trim()) return;

    try {
      setIsSubmittingOtp(true);
      setErrorMessage('');
      const res = await fetch(`/api/partner/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handoverOtpInput: otpInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(`Work-Order ${job.jobTicketNumber} completed! 4-digit OTP verified & escrow funds released.`);
        setOtpInput('');
        await fetchJob();
        setTimeout(() => setActionSuccessMsg(''), 5000);
      } else {
        setErrorMessage(data.error || 'Incorrect handover OTP. Please verify with customer.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error verifying OTP');
    } finally {
      setIsSubmittingOtp(false);
    }
  };

  const isCompleted = job?.status === 'COMPLETED' || job?.status === 'WORK_COMPLETED';
  const isInProgress = job?.status === 'IN_PROGRESS';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <Zap className="h-4 w-4" />
            <span>PTNR-SCR-03 &bull; Work-Order Lifecycle Execution Console</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold text-slate-100">
              Work-Order #{job?.jobTicketNumber || ticketParam}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
              }`}
            >
              {job?.status.replace('_', ' ') || 'LOADING'}
            </span>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-300">
              PIN: {job?.pincode || '400001'}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            Full work-order lifecycle, customer address, materials billing, milestones &amp; 4-digit handover OTP.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/partner/dispatch"
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            &larr; Back to Queue
          </Link>
          <button
            onClick={fetchJob}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Lifecycle
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-300">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Lifecycle Milestones Stepper (PTNR-SCR-03) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Work-Order Lifecycle Progression
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Finite State Machine transitions with mandatory safety interlocks
            </p>
          </div>
          <div className="text-right text-xs">
            <span className="text-slate-400">Target ETA: </span>
            <span className="font-bold text-emerald-400">12 min &bull; Colaba Sector</span>
          </div>
        </div>

        {/* 7-Stage Horizontal Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-emerald-300">
            <div className="text-[10px] uppercase font-bold text-emerald-400">Stage 1</div>
            <div className="font-bold mt-0.5">Booked</div>
            <div className="text-[9px] text-slate-400 font-mono mt-1">11:30 AM</div>
          </div>

          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-emerald-300">
            <div className="text-[10px] uppercase font-bold text-emerald-400">Stage 2</div>
            <div className="font-bold mt-0.5">Dispatched</div>
            <div className="text-[9px] text-slate-400 font-mono mt-1">Rajesh Kumar</div>
          </div>

          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-emerald-300">
            <div className="text-[10px] uppercase font-bold text-emerald-400">Stage 3</div>
            <div className="font-bold mt-0.5">En Route</div>
            <div className="text-[9px] text-slate-400 font-mono mt-1">11:45 AM</div>
          </div>

          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-emerald-300">
            <div className="text-[10px] uppercase font-bold text-emerald-400">Stage 4</div>
            <div className="font-bold mt-0.5">Arrived</div>
            <div className="text-[9px] text-slate-400 font-mono mt-1">11:58 AM</div>
          </div>

          <div
            className={`rounded-lg p-2.5 border ${
              job?.safetyGlovesConfirmed && job?.safetyMcbSwitchConfirmed
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            <div className="text-[10px] uppercase font-bold">Stage 5</div>
            <div className="font-bold mt-0.5">Safety Check</div>
            <div className="text-[9px] mt-1">
              {job?.safetyGlovesConfirmed ? '1000V Gloves OK' : 'Pending Gloves'}
            </div>
          </div>

          <div
            className={`rounded-lg p-2.5 border ${
              isInProgress || isCompleted
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-400'
            }`}
          >
            <div className="text-[10px] uppercase font-bold">Stage 6</div>
            <div className="font-bold mt-0.5">In Progress</div>
            <div className="text-[9px] mt-1">Bearing Repair</div>
          </div>

          <div
            className={`rounded-lg p-2.5 border ${
              isCompleted
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                : 'bg-slate-800/60 border-slate-700 text-slate-400'
            }`}
          >
            <div className="text-[10px] uppercase font-bold">Stage 7</div>
            <div className="font-bold mt-0.5">Handover OTP</div>
            <div className="text-[9px] mt-1 font-mono">
              {isCompleted ? 'Verified (4829)' : 'Awaiting OTP'}
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Customer, Tech, Safety Checklist */}
        <div className="lg:col-span-2 space-y-5">
          {/* Service & Customer Dossier */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <User className="h-4 w-4 text-sky-400" />
                <span>Customer &amp; Location Dossier</span>
              </h3>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                Plan: {job?.customerProfile?.activeSubscriptionPlan || 'ZEX_SHIELD_1MO'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Service Requirement</div>
                <div className="font-bold text-slate-100 text-sm mt-0.5">{job?.serviceTitle}</div>
                <div className="flex items-center gap-1.5 text-slate-300 mt-2">
                  <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{job?.customerAddressText}</span>
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Customer Details</div>
                <div className="font-bold text-slate-100 text-sm mt-0.5">{job?.customerName}</div>
                <div className="flex items-center gap-2 text-slate-300 mt-2 font-mono">
                  <Phone className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <span>{job?.customerPhone}</span>
                  <a
                    href={`tel:${job?.customerPhone}`}
                    className="ml-2 rounded bg-slate-800 px-2 py-0.5 text-[10px] text-emerald-400 hover:bg-slate-700 font-sans"
                  >
                    Direct Call
                  </a>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Lifetime Orders: <strong>{job?.customerProfile?.totalOrdersCount || 4}</strong> &bull; Total Spend: ₹{(job?.customerProfile?.totalSpendInr || 4850).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Fleet Electrician & Safety Checklist */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Wrench className="h-4 w-4 text-emerald-400" />
                <span>Assigned Fleet Electrician &amp; Safety Compliance</span>
              </h3>
              <span className="font-bold text-amber-400 text-xs">
                ★ {job?.technicianProfile?.rating || 4.9} Rating
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-bold text-slate-100 text-sm">
                  {job?.technicianName || 'Rajesh Kumar'}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Badge: {job?.technicianProfile?.badgeNumber || 'TECH-7821'} &bull; Safety Kit: {job?.technicianProfile?.safetyKitSerial || 'SK-1000V-992'}
                </div>
                <div className="text-[11px] text-emerald-400 mt-1">
                  Completed {job?.technicianProfile?.totalJobsCompleted || 142} jobs with zero safety incidents.
                </div>
              </div>

              {/* Safety Interlock Checkbox Toggles */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleToggleSafety('gloves')}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-colors ${
                    job?.safetyGlovesConfirmed
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                  }`}
                >
                  <span className="text-xs font-semibold">
                    1. 1000V Insulated Gloves Calibrated
                  </span>
                  <span className="font-bold">
                    {job?.safetyGlovesConfirmed ? '✓ Verified' : 'Tap to Confirm'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleSafety('mcb')}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-colors ${
                    job?.safetyMcbSwitchConfirmed
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                  }`}
                >
                  <span className="text-xs font-semibold">
                    2. Main Distribution MCB Switched OFF
                  </span>
                  <span className="font-bold">
                    {job?.safetyMcbSwitchConfirmed ? '✓ Verified' : 'Tap to Confirm'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Handover OTP Verification Form */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>4-Digit Service Handover OTP Verification</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Mandatory OTP generated on customer Amit Sharma&apos;s phone to prevent fraud &amp; close the work order.
                </p>
              </div>

              {isCompleted ? (
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/40">
                  COMPLETED &bull; OTP SEALED
                </span>
              ) : (
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Test OTP Code:</span>
                  <div className="font-mono font-bold text-emerald-400 text-sm">
                    {job?.handoverOtp || '4829'}
                  </div>
                </div>
              )}
            </div>

            {!isCompleted && (
              <form onSubmit={handleVerifyOtp} className="flex items-center gap-3 pt-2">
                <input
                  type="text"
                  maxLength={4}
                  placeholder="Enter 4-digit OTP (e.g. 4829)"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white font-mono tracking-widest text-center w-52 focus:outline-none focus:border-emerald-500"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmittingOtp || otpInput.length < 4}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                >
                  {isSubmittingOtp ? 'Verifying OTP...' : 'Verify OTP & Complete Job'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Col: Materials Billing & 3-Way Commission Split */}
        <div className="space-y-5">
          {/* Official GST Invoice Breakdown */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Tax Invoice Breakdown
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {job?.invoice?.invoiceNumber || 'INV-2026-001'}
                </p>
              </div>
              <span className="rounded bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                {job?.invoice?.paymentStatus || 'PAID via UPI'}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Base Labor Charges:</span>
                <span className="font-mono font-semibold">₹1,059.32</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">CGST (9.0%):</span>
                <span className="font-mono">₹95.34</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">SGST (9.0%):</span>
                <span className="font-mono">₹95.34</span>
              </div>
              <div className="flex justify-between py-1 font-bold text-slate-100 text-sm">
                <span>Total Amount Paid:</span>
                <span className="font-mono text-emerald-400">₹1,250.00</span>
              </div>
            </div>
          </div>

          {/* 3-Way Commission Split (TASK-009 / PTNR-SCR-03) */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  3-Way Escrow Split
                </h3>
                <p className="text-[11px] text-slate-400">
                  Automated revenue distribution
                </p>
              </div>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <div className="font-bold text-emerald-300">Franchise Share (15.0%)</div>
                  <div className="text-[10px] text-slate-400">Maharashtra Hub MH-01</div>
                </div>
                <div className="font-bold text-emerald-400 text-sm">
                  +₹158.90
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sky-300">Technician Net Payout (70.0%)</div>
                  <div className="text-[10px] text-slate-400">Rajesh Kumar (Direct Transfer)</div>
                </div>
                <div className="font-bold text-sky-400 text-sm">
                  +₹741.52
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
                <div>
                  <div className="font-bold text-purple-300">Platform Royalty (15.0%)</div>
                  <div className="text-[10px] text-slate-400">ElectriCare National Cloud</div>
                </div>
                <div className="font-bold text-purple-400 text-sm">
                  +₹158.90
                </div>
              </div>

              <div className="p-2 rounded bg-slate-800 text-[10px] text-slate-400 text-center font-sans">
                Statutory 18% GST (₹190.68) withheld in Escrow Tax Ledger for GSTR-3B return.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PartnerJobDetailsPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading work order...</div>}>
      <PartnerJobDetailsContent />
    </React.Suspense>
  );
}
