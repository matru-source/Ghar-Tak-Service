'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRealtimeEvents } from '@/lib/use-realtime-events';
import {
  Zap,
  User,
  Phone,
  MapPin,
  Clock,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  ExternalLink,
} from '@/components/ui/icons';

interface JobOrder {
  id: string;
  jobTicketNumber: string;
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
    id: string;
    fullName: string;
    phone: string;
    activeSubscriptionPlan?: string;
    totalOrdersCount?: number;
    totalSpendInr?: number;
  };
  technicianProfile?: {
    id: string;
    badgeNumber: string;
    fullName: string;
    rating: number;
    safetyKitSerial?: string;
    totalJobsCompleted?: number;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    baseAmountInr: number;
    cgstInr: number;
    sgstInr: number;
    totalAmountInr: number;
    paymentStatus: string;
  };
}

function PartnerJobDetailsContent() {
  const searchParams = useSearchParams();
  const ticketParam = searchParams.get('ticket') || 'J-1001';

  const [job, setJob] = useState<JobOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [otpInput, setOtpInput] = useState('');
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchJob = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/partner/jobs/${encodeURIComponent(ticketParam)}`);
      const data = await res.json();
      if (data.success && data.job) {
        setJob(data.job);
      } else {
        setErrorMessage('Failed to load job order details.');
      }
    } catch (err: any) {
      console.error('Error fetching job details:', err);
      setErrorMessage(err.message || 'Error loading job details');
    } finally {
      setLoading(false);
    }
  };

  const handleJobRealtimeEvent = useCallback((event: any) => {
    // If event corresponds to this ticket / job or any lifecycle change, refresh live
    const isRelevantTicket =
      !event.ticketNumber ||
      !ticketParam ||
      event.ticketNumber.toLowerCase().replace(/[^a-z0-9]/g, '') === ticketParam.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (
      isRelevantTicket &&
      (event.type === 'JOB_STATUS_UPDATE' ||
        event.type === 'TECH_ARRIVED' ||
        event.type === 'TECH_ACCEPTED' ||
        event.type === 'TECH_DISPATCHED' ||
        event.type === 'SAFETY_INTERLOCK_VERIFIED' ||
        event.type === 'JOB_COMPLETED' ||
        event.type === 'EMERGENCY_SOS' ||
        event.type === 'PAYMENT_RECEIVED' ||
        event.type === 'JOB_PRICE_UPDATED')
    ) {
      fetchJob();
    }
  }, [ticketParam]);

  const { status: jobBusStatus } = useRealtimeEvents({
    role: 'PARTNER',
    jobId: job?.id,
    onEvent: handleJobRealtimeEvent,
  });

  useEffect(() => {
    fetchJob();
    const interval = setInterval(fetchJob, 20000);
    return () => clearInterval(interval);
  }, [ticketParam]);

  const handleToggleSafety = async (field: 'gloves' | 'mcb') => {
    if (!job) return;

    const newGloves = field === 'gloves' ? !job.safetyGlovesConfirmed : job.safetyGlovesConfirmed;
    const newMcb = field === 'mcb' ? !job.safetyMcbSwitchConfirmed : job.safetyMcbSwitchConfirmed;

    try {
      const res = await fetch(`/api/partner/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          safetyGlovesConfirmed: newGloves,
          safetyMcbSwitchConfirmed: newMcb,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setJob((prev) =>
          prev
            ? {
                ...prev,
                safetyGlovesConfirmed: newGloves,
                safetyMcbSwitchConfirmed: newMcb,
              }
            : null
        );
        setActionSuccessMsg(`Safety interlock checklist updated`);
        setTimeout(() => setActionSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error('Error updating safety compliance:', err);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !otpInput) return;

    try {
      setIsSubmittingOtp(true);
      setErrorMessage('');
      const res = await fetch(`/api/partner/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VERIFY_HANDOVER_OTP',
          otp: otpInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg('4-Digit Handover OTP Verified! Work-Order marked COMPLETED.');
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
      {/* Top Banner — Clean White Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            <Zap className="h-4 w-4 text-[#1B5E20]" />
            <span>PTNR-SCR-03 &bull; Work-Order Lifecycle Execution Console</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Work-Order #{job?.jobTicketNumber || ticketParam}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                isCompleted
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-sky-100 text-sky-800 border border-sky-300'
              }`}
            >
              {job?.status.replace('_', ' ') || 'LOADING'}
            </span>
            <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-mono font-bold text-slate-700 border border-slate-200">
              PIN: {job?.pincode || '400001'}
            </span>
            <span className={`rounded-lg px-2 py-0.5 text-xs font-bold flex items-center gap-1.5 ${
              jobBusStatus === 'CONNECTED'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${jobBusStatus === 'CONNECTED' ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
              {jobBusStatus === 'CONNECTED' ? 'LIVE TELEMETRY' : 'CONNECTING...'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Full work-order lifecycle, customer address, materials billing, milestones &amp; 4-digit handover OTP.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/partner/dispatch"
            className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition shadow-2xs"
          >
            &larr; Back to Queue
          </Link>
          <button
            onClick={fetchJob}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Lifecycle
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs font-bold text-rose-800 shadow-xs">
          <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Lifecycle Milestones Stepper (PTNR-SCR-03) — Clean White Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Work-Order Lifecycle Progression
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Finite State Machine transitions with mandatory safety interlocks
            </p>
          </div>
          <div className="text-right text-xs">
            <span className="text-slate-400 font-semibold">Target ETA: </span>
            <span className="font-black text-emerald-700">12 min &bull; Colaba Sector</span>
          </div>
        </div>

        {/* 7-Stage Horizontal Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-800">
            <div className="text-[10px] uppercase font-black text-emerald-700">Stage 1</div>
            <div className="font-bold mt-0.5">Booked</div>
            <div className="text-[9px] text-slate-500 font-mono mt-1">11:30 AM</div>
          </div>

          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-800">
            <div className="text-[10px] uppercase font-black text-emerald-700">Stage 2</div>
            <div className="font-bold mt-0.5">Dispatched</div>
            <div className="text-[9px] text-slate-500 font-mono mt-1 truncate">
              {job?.technicianName || job?.technicianProfile?.fullName || 'Assigned Tech'}
            </div>
          </div>

          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-800">
            <div className="text-[10px] uppercase font-black text-emerald-700">Stage 3</div>
            <div className="font-bold mt-0.5">En Route</div>
            <div className="text-[9px] text-slate-500 font-mono mt-1">11:45 AM</div>
          </div>

          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-800">
            <div className="text-[10px] uppercase font-black text-emerald-700">Stage 4</div>
            <div className="font-bold mt-0.5">Arrived</div>
            <div className="text-[9px] text-slate-500 font-mono mt-1">11:58 AM</div>
          </div>

          <div
            className={`rounded-xl p-3 border ${
              job?.safetyGlovesConfirmed && job?.safetyMcbSwitchConfirmed
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <div className="text-[10px] uppercase font-black">Stage 5</div>
            <div className="font-bold mt-0.5">Safety Check</div>
            <div className="text-[9px] mt-1 font-semibold">
              {job?.safetyGlovesConfirmed ? '1000V Gloves OK' : 'Pending Gloves'}
            </div>
          </div>

          <div
            className={`rounded-xl p-3 border ${
              isInProgress || isCompleted
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <div className="text-[10px] uppercase font-black">Stage 6</div>
            <div className="font-bold mt-0.5">In Progress</div>
            <div className="text-[9px] mt-1 font-semibold">Bearing Repair</div>
          </div>

          <div
            className={`rounded-xl p-3 border ${
              isCompleted
                ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <div className="text-[10px] uppercase font-black">Stage 7</div>
            <div className="font-bold mt-0.5">Handover OTP</div>
            <div className="text-[9px] mt-1 font-mono font-bold">
              {isCompleted ? 'Verified (4829)' : 'Awaiting OTP'}
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Customer, Tech, Safety Checklist */}
        <div className="lg:col-span-2 space-y-5">
          {/* Service & Customer Dossier — Clean White Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <User className="h-4 w-4 text-sky-600" />
                <span>Customer &amp; Location Dossier</span>
              </h3>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                Plan: {job?.customerProfile?.activeSubscriptionPlan || 'ZEX_SHIELD_1MO'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Service Requirement</div>
                <div className="font-black text-slate-900 text-sm mt-0.5">{job?.serviceTitle}</div>
                <div className="flex items-center gap-1.5 text-slate-600 mt-2">
                  <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{job?.customerAddressText}</span>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Customer Details</div>
                <div className="font-black text-slate-900 text-sm mt-0.5">{job?.customerName}</div>
                <div className="flex items-center gap-2 text-slate-600 mt-2 font-mono">
                  <Phone className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                  <span>{job?.customerPhone}</span>
                  <a
                    href={`tel:${job?.customerPhone}`}
                    className="ml-2 rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] text-[#1B5E20] font-bold hover:bg-emerald-100 font-sans"
                  >
                    Direct Call
                  </a>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Lifetime Orders: <strong>{job?.customerProfile?.totalOrdersCount || 4}</strong> &bull; Total Spend: ₹{(job?.customerProfile?.totalSpendInr || 4850).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Fleet Electrician & Safety Checklist — Clean White Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Wrench className="h-4 w-4 text-emerald-600" />
                <span>Assigned Fleet Electrician &amp; Safety Compliance</span>
              </h3>
              <span className="font-black text-amber-500 text-xs">
                ★ {job?.technicianProfile?.rating || (job?.technicianName ? '5.0' : '—')} Rating
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-black text-slate-900 text-sm">
                  {job?.technicianName || (job?.technicianId ? 'Assigned Doorstep Specialist' : 'Unassigned / Pending Allocation')}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Badge: {job?.technicianProfile?.badgeNumber || (job?.technicianId ? `ID: ${job.technicianId}` : '—')}{job?.technicianProfile?.safetyKitSerial ? ` • Safety Kit: ${job.technicianProfile.safetyKitSerial}` : ''}
                </div>
                <div className="text-[11px] text-emerald-700 font-medium mt-1">
                  {job?.technicianProfile?.totalJobsCompleted !== undefined
                    ? `Completed ${job.technicianProfile.totalJobsCompleted} jobs with zero safety incidents.`
                    : (job?.technicianName ? 'Verified service specialist.' : 'Technician will be dispatched shortly.')}
                </div>
              </div>

              {/* Safety Interlock Checkbox Toggles */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleToggleSafety('gloves')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                    job?.safetyGlovesConfirmed
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-amber-300 bg-amber-50 text-amber-800'
                  }`}
                >
                  <span className="text-xs font-bold">
                    1. 1000V Insulated Gloves Calibrated
                  </span>
                  <span className="font-black text-xs">
                    {job?.safetyGlovesConfirmed ? '✓ Verified' : 'Tap to Confirm'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleSafety('mcb')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                    job?.safetyMcbSwitchConfirmed
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-amber-300 bg-amber-50 text-amber-800'
                  }`}
                >
                  <span className="text-xs font-bold">
                    2. Main Distribution MCB Switched OFF
                  </span>
                  <span className="font-black text-xs">
                    {job?.safetyMcbSwitchConfirmed ? '✓ Verified' : 'Tap to Confirm'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Handover OTP Verification Form — Clean White Card */}
          <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>4-Digit Service Handover OTP Verification</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mandatory OTP generated on customer phone to prevent fraud &amp; seal work order.
                </p>
              </div>

              {isCompleted ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300 self-start sm:self-auto">
                  COMPLETED &bull; OTP SEALED
                </span>
              ) : (
                <div className="text-right self-start sm:self-auto">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Test OTP Code:</span>
                  <div className="font-mono font-black text-emerald-700 text-sm">
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
                  placeholder="Enter 4-digit OTP"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm text-slate-900 font-mono font-bold tracking-widest text-center w-52 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmittingOtp || otpInput.length < 4}
                  className="rounded-xl bg-[#1B5E20] hover:bg-[#0D3B0D] px-5 py-2.5 text-xs font-bold text-white transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingOtp ? 'Verifying OTP...' : 'Verify OTP & Complete Job'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Col: Materials Billing & 3-Way Commission Split */}
        <div className="space-y-5">
          {/* Official GST Invoice Breakdown — Clean White Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Tax Invoice Breakdown
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {job?.invoice?.invoiceNumber || 'INV-2026-001'}
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold">
                {job?.invoice?.paymentStatus || 'PAID via UPI'}
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 font-medium">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Base Labor Charges:</span>
                <span className="font-mono font-bold text-slate-900">₹1,059.32</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">CGST (9.0%):</span>
                <span className="font-mono text-slate-900">₹95.34</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">SGST (9.0%):</span>
                <span className="font-mono text-slate-900">₹95.34</span>
              </div>
              <div className="flex justify-between py-1 font-black text-slate-900 text-sm pt-1">
                <span>Total Amount Paid:</span>
                <span className="font-mono text-emerald-700">₹1,250.00</span>
              </div>
            </div>
          </div>

          {/* 3-Way Commission Split (TASK-009 / PTNR-SCR-03) — Clean White Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  3-Way Escrow Split
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Automated revenue distribution
                </p>
              </div>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 text-slate-700">
                <span className="text-slate-500 font-medium">Technician Payout (70%):</span>
                <span className="font-bold font-mono text-slate-900">₹741.52</span>
              </div>
              <div className="flex justify-between py-1 text-slate-700">
                <span className="text-slate-500 font-medium">Regional Partner Escrow (15%):</span>
                <span className="font-bold font-mono text-emerald-700">₹158.90</span>
              </div>
              <div className="flex justify-between py-1 text-slate-700">
                <span className="text-slate-500 font-medium">GTS Platform Tech Fee (15%):</span>
                <span className="font-bold font-mono text-slate-900">₹158.90</span>
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
    <Suspense fallback={<div className="p-8 text-center text-slate-500 text-xs">Loading Work-Order Dossier...</div>}>
      <PartnerJobDetailsContent />
    </Suspense>
  );
}
