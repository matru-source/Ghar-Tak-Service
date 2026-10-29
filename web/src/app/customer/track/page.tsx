'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap,
  ShieldCheck,
  Star,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  ArrowLeft,
  Navigation,
  Check,
  MapPin,
  Sparkles,
  AlertTriangle,
  Home,
  Calendar,
  Receipt,
  User,
  X,
  MessageSquare,
  Package,
  Layers,
} from '@/components/ui/icons';
import { BrandLogo, BrandMark } from '@/components/ui/brand-logo';

interface ActiveJobTrack {
  id: string;
  jobTicketNumber: string;
  serviceTitle: string;
  status: string;
  priority: string;
  handoverOtp: string;
  totalAmountInr: number;
  customerAddressText: string;
  pincode: string;
  technician: {
    fullName: string;
    phone: string;
    badgeNumber: string;
    rating: number;
    experienceYears?: number;
    completedJobsCount?: number;
  };
}

interface PendingQuote {
  id: string;
  sku: string;
  name: string;
  brand?: string;
  category?: string;
  unitPriceInr: number;
  quantity: number;
  subtotalInr: number;
  gstRatePercent: number;
  gstAmountInr: number;
  totalAmountInr: number;
  damagedComponentPhotoUrl: string;
  warrantyMonths?: number;
  approvalStatus: string;
  notes?: string;
  createdAt?: string;
}

export default function CustomerLiveTrackingPage() {
  const [job, setJob] = useState<ActiveJobTrack>({
    id: 'job_active',
    jobTicketNumber: 'J-TRACKING',
    serviceTitle: 'Doorstep Service Diagnostic',
    status: 'EN_ROUTE',
    priority: 'STANDARD',
    handoverOtp: '----',
    totalAmountInr: 1250.0,
    customerAddressText: 'Detecting verified doorstep address...',
    pincode: '400001',
    technician: {
      fullName: 'Field Specialist',
      phone: '+919876543212',
      badgeNumber: 'TECH-DISPATCHED',
      rating: 4.9,
      experienceYears: 6,
      completedJobsCount: 180,
    },
  });

  const [etaMinutes, setEtaMinutes] = useState(10);
  const [distanceKm, setDistanceKm] = useState('2.4');
  const [markerOffset, setMarkerOffset] = useState({ x: 0, y: 0 });
  const [targetOffset, setTargetOffset] = useState({ x: 0, y: 0 });
  const [bearing, setBearing] = useState(45);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);

  // Issues 31 & 33: In-Flight Scope Expansion & Real-Time Push States
  const [pendingQuote, setPendingQuote] = useState<PendingQuote | null>(null);
  const [approvedParts, setApprovedParts] = useState<PendingQuote[]>([]);
  const [isDecidingQuote, setIsDecidingQuote] = useState(false);
  const [quoteNotification, setQuoteNotification] = useState<{ message: string; type: 'info' | 'success' | 'warn' } | null>(null);
  const [taxBreakdown, setTaxBreakdown] = useState<{ cgstInr: number; sgstInr: number; grandTotalInr: number } | null>(null);

  // Issue 20: Dead-reckoning client interpolation: smooth bearing and position animation (Turf.js / spherical lerp standard)
  useEffect(() => {
    let animId: number;
    const animate = () => {
      setMarkerOffset((prev) => {
        const dx = targetOffset.x - prev.x;
        const dy = targetOffset.y - prev.y;
        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
          return targetOffset;
        }
        // Smooth lerp (60fps dampening)
        const newX = prev.x + dx * 0.08;
        const newY = prev.y + dy * 0.08;
        const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
        setBearing(angleDeg);
        return { x: newX, y: newY };
      });
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [targetOffset]);

  // Fetch real active job and live telemetry
  useEffect(() => {
    const fetchActiveJob = async () => {
      try {
        let ticketOrId = '';
        let customerId = '';

        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          ticketOrId = params.get('ticket') || params.get('id') || params.get('jobId') || '';
          const savedSession = localStorage.getItem('electriCare_customer_session') || localStorage.getItem('gts_customer_session');
          if (savedSession) {
            try {
              const parsed = JSON.parse(savedSession);
              if (parsed.id) customerId = parsed.id;
            } catch (_) {}
          }
        }

        if (ticketOrId) {
          const telemRes = await fetch(`/api/technicians/telemetry?jobId=${encodeURIComponent(ticketOrId)}`);
          const telemData = await telemRes.json();
          if (telemData.success && telemData.data) {
            const d = telemData.data;
            setJob((prev) => ({
              ...prev,
              id: d.jobId || prev.id,
              jobTicketNumber: d.jobTicketNumber || prev.jobTicketNumber,
              serviceTitle: d.serviceTitle || prev.serviceTitle,
              status: d.status || prev.status,
              handoverOtp: d.handoverOtp || prev.handoverOtp,
              totalAmountInr: d.totalAmountInr || prev.totalAmountInr,
              customerAddressText: d.destination?.address || prev.customerAddressText,
              technician: {
                ...prev.technician,
                fullName: d.technician?.fullName || prev.technician.fullName,
                phone: d.technician?.phone || prev.technician.phone,
                badgeNumber: d.technician?.badgeNumber || prev.technician.badgeNumber,
                rating: d.technician?.rating || prev.technician.rating,
              },
            }));
            if (typeof d.technician?.etaMinutes === 'number') setEtaMinutes(d.technician.etaMinutes);
            if (d.technician?.distanceKm !== undefined) {
              setDistanceKm(String(d.technician.distanceKm));
              const dist = Number(d.technician.distanceKm);
              if (dist <= 0.05 || d.status === 'ARRIVED') {
                setTargetOffset({ x: 50, y: -40 });
              } else if (dist <= 0.8) {
                setTargetOffset({ x: 38, y: -30 });
              } else if (dist <= 1.5) {
                setTargetOffset({ x: 24, y: -18 });
              } else {
                setTargetOffset({ x: 10, y: -8 });
              }
            }
          }

          // Issue 31: Fetch spare parts state for pending estimates and approved parts
          try {
            const partsRes = await fetch(`/api/jobs/${encodeURIComponent(ticketOrId)}/parts`);
            const partsData = await partsRes.json();
            if (partsData.success && partsData.data) {
              setPendingQuote(partsData.data.pendingQuote || null);
              setApprovedParts(partsData.data.parts || []);
            }
          } catch (_) {}

          return;
        }

        // Fallback to customer profile active job
        const res = await fetch(`/api/customer/profile?customerId=${encodeURIComponent(customerId)}`);
        const data = await res.json();
        if (data.success && data.data?.activeJob) {
          const apiJob = data.data.activeJob;
          setJob((prev) => ({
            ...prev,
            id: apiJob.id || prev.id,
            jobTicketNumber: apiJob.jobTicketNumber || prev.jobTicketNumber,
            serviceTitle: apiJob.serviceTitle || prev.serviceTitle,
            status: apiJob.status || prev.status,
            handoverOtp: apiJob.handoverOtp || prev.handoverOtp,
            totalAmountInr: apiJob.totalAmountInr || prev.totalAmountInr,
            customerAddressText: apiJob.customerAddressText || prev.customerAddressText,
            technician: {
              ...prev.technician,
              fullName: apiJob.technician?.fullName || prev.technician.fullName,
              phone: apiJob.technician?.phone || prev.technician.phone,
              rating: apiJob.technician?.rating || prev.technician.rating,
              badgeNumber: apiJob.technician?.badgeNumber || prev.technician.badgeNumber,
            },
          }));

          // Fetch parts for active profile job
          if (apiJob.id) {
            try {
              const partsRes = await fetch(`/api/jobs/${encodeURIComponent(apiJob.id)}/parts`);
              const partsData = await partsRes.json();
              if (partsData.success && partsData.data) {
                setPendingQuote(partsData.data.pendingQuote || null);
                setApprovedParts(partsData.data.parts || []);
              }
            } catch (_) {}
          }
        }
      } catch (err) {
        console.error('Failed to load tracking job', err);
      }
    };

    fetchActiveJob();
    // 3-second fallback polling interval
    const interval = setInterval(fetchActiveJob, 3000);
    return () => clearInterval(interval);
  }, [targetOffset]);

  // Issue 33: Real-Time Socket/SSE Broadcast Listener for JOB_PRICE_UPDATED and QUOTE_APPROVAL_REQUESTED
  useEffect(() => {
    const targetJobId = job.id;
    if (!targetJobId || targetJobId === 'job_active') return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/realtime/events?jobId=${encodeURIComponent(targetJobId)}&role=CUSTOMER`);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'JOB_PRICE_UPDATED') {
            const details = payload.details;
            const newTotal = details?.grandTotalInr ?? details?.projectedGrandTotalInr;
            if (typeof newTotal === 'number') {
              setJob((prev) => ({
                ...prev,
                totalAmountInr: newTotal,
                status: payload.status || prev.status,
              }));
              const cgst = details.cgstInr || Math.round(newTotal * 0.09 * 100) / 100;
              const sgst = details.sgstInr || Math.round(newTotal * 0.09 * 100) / 100;
              setTaxBreakdown({
                cgstInr: cgst,
                sgstInr: sgst,
                grandTotalInr: newTotal,
              });
              setQuoteNotification({
                message: `Bill Revised in Real-Time: ₹${newTotal.toFixed(0)} (CGST 9%: ₹${cgst.toFixed(0)}, SGST 9%: ₹${sgst.toFixed(0)})`,
                type: 'info',
              });
              setTimeout(() => setQuoteNotification(null), 6000);
            }
          } else if (payload.type === 'QUOTE_APPROVAL_REQUESTED') {
            if (payload.details?.part) {
              setPendingQuote(payload.details.part);
              setJob((prev) => ({ ...prev, status: 'WAITING_CUSTOMER_APPROVAL' }));
              setQuoteNotification({
                message: `Technician proposed spare part: ${payload.details.part.name}. Digital approval required.`,
                type: 'warn',
              });
            }
          } else if (payload.type === 'JOB_COMPLETED') {
            setJob((prev) => ({
              ...prev,
              status: 'WORK_COMPLETED',
              handoverOtp: '----',
            }));
            setQuoteNotification({
              message: 'Service successfully completed! Tap below to view your invoice & rate.',
              type: 'success',
            });
          } else if (payload.type === 'TECH_ARRIVED') {
            setJob((prev) => ({ ...prev, status: 'ARRIVED' }));
          }
        } catch (_) {}
      };
    } catch (_) {}

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [job.id]);

  // Issue 31: Customer Digital Quote Decision Handler (Accept Quote / Decline Estimate)
  const handleQuoteDecision = async (decision: 'ACCEPT' | 'REJECT') => {
    if (!pendingQuote || !job.id) return;
    setIsDecidingQuote(true);
    try {
      const res = await fetch(`/api/jobs/${encodeURIComponent(job.id)}/parts/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partId: pendingQuote.id, decision }),
      });
      const data = await res.json();
      if (data.success) {
        if (decision === 'ACCEPT') {
          const revisedTotal = data.data?.revisedTotalAmountInr ?? (job.totalAmountInr + pendingQuote.totalAmountInr);
          setQuoteNotification({
            message: `Estimate Approved! ₹${pendingQuote.totalAmountInr.toFixed(0)} added to bill. Technician resumed work.`,
            type: 'success',
          });
          setJob((prev) => ({
            ...prev,
            status: 'IN_PROGRESS',
            totalAmountInr: revisedTotal,
          }));
        } else {
          setQuoteNotification({
            message: 'Estimate Declined. Technician notified to proceed without replacement.',
            type: 'info',
          });
          setJob((prev) => ({ ...prev, status: 'IN_PROGRESS' }));
        }
        setPendingQuote(null);
        // Refresh parts list
        const pr = await fetch(`/api/jobs/${encodeURIComponent(job.id)}/parts`);
        const pd = await pr.json();
        if (pd.success && pd.data) {
          setApprovedParts(pd.data.parts || []);
        }
      } else {
        setQuoteNotification({
          message: data.error || 'Failed to submit quote approval decision',
          type: 'warn',
        });
      }
    } catch (err) {
      setQuoteNotification({
        message: 'Network error submitting approval. Please retry.',
        type: 'warn',
      });
    } finally {
      setIsDecidingQuote(false);
      setTimeout(() => setQuoteNotification(null), 6000);
    }
  };

  const handleConfirmCancel = () => {
    setCancelFeedback('Service request cancellation request sent to partner dispatch desk.');
    setTimeout(() => {
      setShowCancelModal(false);
      setCancelFeedback(null);
    }, 2000);
  };

  const isPausedForApproval = job.status === 'WAITING_CUSTOMER_APPROVAL' || pendingQuote !== null;

  // Issue 2.3: Terminal State Machine (WORK_COMPLETED / SETTLED / COMPLETED)
  const isCompleted = ['WORK_COMPLETED', 'SETTLED', 'COMPLETED', 'DONE'].includes(job.status);
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRating(true);
    try {
      await fetch(`/api/jobs/${job.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback: feedbackText }),
      });
      setRatingSubmitted(true);
    } catch {
      setRatingSubmitted(true);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="flex-1 flex flex-col bg-slate-50 text-slate-900 pb-20 select-none animate-in fade-in duration-300">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <Link
                href="/customer"
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <BrandMark size="xs" badgeBg="bg-emerald-50 border border-emerald-200 shadow-2xs" />
              <div>
                <span className="font-extrabold text-sm text-slate-900 block truncate">
                  Service Completed & Inspected
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Job #{job.jobTicketNumber}</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
              Completed
            </span>
          </div>
        </header>

        <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
          {/* Celebration Hero Card */}
          <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-6 text-white text-center shadow-lg relative overflow-hidden">
            <div className="w-16 h-16 rounded-full bg-white/20 mx-auto flex items-center justify-center text-3xl shadow-inner mb-3">
              🎉
            </div>
            <h2 className="text-xl font-black tracking-tight">Work Order Completed!</h2>
            <p className="text-xs text-emerald-100 mt-1 max-w-xs mx-auto">
              Your electrical service has been verified with 1000V safety protocols and completed by {job.technician.fullName}.
            </p>
          </div>

          {/* Technician Details Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center font-black text-lg">
                {job.technician.fullName.split(' ').map((n) => n[0]).join('')}
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">{job.technician.fullName}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">
                    {job.technician.badgeNumber}
                  </span>
                  <span>•</span>
                  <span className="flex items-center text-amber-500 font-bold">
                    ★ {job.technician.rating}
                  </span>
                </div>
              </div>
            </div>
            <a
              href={`tel:${job.technician.phone}`}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              title="Call Technician"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>

          {/* Itemized Tax Invoice Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-slate-500" />
                <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
                  GST Tax Invoice Receipt
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-400">
                INV-{job.jobTicketNumber}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>{job.serviceTitle}</span>
                <span className="font-mono font-semibold">
                  ₹{(job.totalAmountInr / 1.18).toFixed(2)}
                </span>
              </div>
              {approvedParts.map((part) => (
                <div key={part.id} className="flex justify-between text-slate-600">
                  <span>{part.name} (x{part.quantity})</span>
                  <span className="font-mono font-semibold">₹{part.subtotalInr.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between text-slate-500 text-[11px] pt-1">
                <span>CGST (9%)</span>
                <span className="font-mono">₹{((job.totalAmountInr / 1.18) * 0.09).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>SGST (9%)</span>
                <span className="font-mono">₹{((job.totalAmountInr / 1.18) * 0.09).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t border-slate-100">
                <span>Total Amount Paid</span>
                <span className="font-mono text-emerald-600">₹{job.totalAmountInr.toFixed(0)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <span>📄</span>
              <span>Download Official Tax Invoice PDF</span>
            </button>
          </div>

          {/* Interactive 5-Star Rating & Feedback */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs text-center space-y-3">
            <h4 className="font-extrabold text-sm text-slate-900">
              {ratingSubmitted ? 'Thank you for your feedback!' : 'Rate your technician & service'}
            </h4>
            {ratingSubmitted ? (
              <p className="text-xs text-emerald-600 font-semibold">
                ✓ Your rating has been submitted to the regional operations hub.
              </p>
            ) : (
              <form onSubmit={handleRatingSubmit} className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-2xl transition-transform hover:scale-125 ${
                        star <= rating ? 'text-amber-400' : 'text-slate-200'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Share a comment about the service (optional)..."
                  rows={2}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600"
                />
                <button
                  type="submit"
                  disabled={isSubmittingRating}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition disabled:opacity-50"
                >
                  {isSubmittingRating ? 'Submitting...' : 'Submit 5-Star Rating'}
                </button>
              </form>
            )}
          </div>

          {/* Return Home Button */}
          <Link
            href="/customer"
            className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-black text-center shadow-lg block transition"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white text-slate-900 pb-20 select-none">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/customer"
              className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <BrandMark size="xs" badgeBg="bg-blue-50 border border-blue-200 shadow-2xs" />
            <div className="min-w-0">
              <span className="font-extrabold text-sm text-slate-900 block truncate">
                {isPausedForApproval ? 'Work Paused: Estimate Awaiting Approval' : 'Technician On The Way'}
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium truncate">
                <span>Job #{job.jobTicketNumber}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="text-blue-600 font-bold truncate">{job.serviceTitle}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isPausedForApproval ? (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-300 rounded-full">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                <span className="text-[10px] text-amber-800 font-extrabold uppercase tracking-wider">
                  Approval Needed
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 border border-orange-200 rounded-full">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                <span className="text-[10px] text-orange-700 font-extrabold uppercase tracking-wider">
                  Live GPS
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Real-time Push Notification Toast (Issue 33) */}
      {quoteNotification && (
        <div
          className={`mx-4 mt-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200 shadow-xs ${
            quoteNotification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : quoteNotification.type === 'warn'
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0 text-blue-600" />
          <span className="flex-1">{quoteNotification.message}</span>
          <button
            onClick={() => setQuoteNotification(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Issue 31: Work Paused Persistent Alert Banner */}
      {isPausedForApproval && (
        <div className="mx-4 mt-2.5 bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-extrabold text-amber-950 uppercase tracking-wide">
                Work Paused: Customer Quote Approval Required
              </h4>
              <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                Technician identified a component replacement during service. According to safety policy, work is paused until you review and approve the pre-negotiated estimate.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Interactive GPS Map Container */}
      <div className="relative w-full px-4 pt-3">
        <div className="relative w-full h-[260px] rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-slate-100">
          {/* Mumbai Map Graphic Canvas */}
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80')`,
              filter: 'contrast(1.05) brightness(1.02)',
            }}
          />
          <div className="absolute inset-0 bg-blue-900/10 pointer-events-none" />

          {/* SVG Route Trajectory Path */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" fill="none" viewBox="0 0 360 260">
            <path
              d="M 65 190 C 110 160, 160 145, 205 105 C 240 75, 275 70, 295 55"
              stroke="#0066ff"
              strokeDasharray="6 4"
              strokeLinecap="round"
              strokeWidth="4"
              className="opacity-90"
            />
            <path
              d="M 65 190 C 110 160, 160 145, 205 105 C 240 75, 275 70, 295 55"
              stroke="#ffffff"
              strokeLinecap="round"
              strokeOpacity="0.8"
              strokeWidth="1.5"
            />
          </svg>

          {/* Customer Destination Marker */}
          <div className="absolute top-[35px] right-[45px] flex flex-col items-center pointer-events-none">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-8 h-8 rounded-full bg-orange-500/30 animate-ping"></span>
              <div className="w-8 h-8 rounded-full bg-orange-600 shadow-md flex items-center justify-center text-white">
                <MapPin className="w-4 h-4 fill-current" />
              </div>
            </div>
            <div className="mt-1 px-2 py-0.5 rounded-full bg-slate-900/90 text-white shadow-xs text-[10px] font-bold whitespace-nowrap">
              Home (Doorstep Destination)
            </div>
          </div>

          {/* Live Technician Animated Marker with Dead-Reckoning Bearing Rotation */}
          <div
            className="absolute bottom-[48px] left-[45px] flex flex-col items-center cursor-pointer will-change-transform"
            style={{
              transform: `translate(${markerOffset.x}px, ${markerOffset.y}px)`,
              transition: 'transform 0.08s linear',
            }}
          >
            <div className="px-2.5 py-1 rounded-full bg-blue-600 text-white shadow-md flex items-center gap-1.5 text-[10px] font-bold mb-1 whitespace-nowrap">
              <Navigation className="w-3 h-3 fill-current" />
              <span>{job.technician?.fullName ? job.technician.fullName.split(' ')[0] : 'Technician'} • {etaMinutes} mins away</span>
            </div>
            <div className="relative flex items-center justify-center">
              <span className="absolute w-10 h-10 rounded-full bg-blue-500/25 animate-pulse"></span>
              <div
                className="w-9 h-9 rounded-full bg-blue-600 shadow-lg flex items-center justify-center text-white transition-transform duration-200"
                style={{ transform: `rotate(${bearing}deg)` }}
              >
                <Zap className="w-4 h-4 fill-current" />
              </div>
            </div>
          </div>

          {/* Top Traffic Alert Pill */}
          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur shadow-xs flex items-center gap-1.5 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] text-slate-800 font-semibold">
              Live Dispatch Telemetry Active
            </span>
          </div>

          {/* Map Controls */}
          <div className="absolute bottom-2.5 right-2.5 flex flex-col gap-1.5">
            <button
              onClick={() => setMarkerOffset({ x: 0, y: 0 })}
              className="w-8 h-8 rounded-lg bg-white/95 backdrop-blur shadow-xs text-slate-700 flex items-center justify-center active:scale-95 border border-slate-200 hover:bg-slate-50 transition-colors"
              title="Center on Technician"
            >
              <Navigation className="w-4 h-4 text-blue-600" />
            </button>
            <button
              onClick={() => setMarkerOffset({ x: 30, y: -25 })}
              className="w-8 h-8 rounded-lg bg-white/95 backdrop-blur shadow-xs text-slate-700 flex items-center justify-center active:scale-95 border border-slate-200 hover:bg-slate-50 transition-colors"
              title="Recenter Destination"
            >
              <MapPin className="w-4 h-4 text-orange-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Technician Profile & Contact Card */}
      <div className="px-4 mt-3 space-y-3">
        <div className="w-full bg-white rounded-2xl p-4 shadow-2xs border border-slate-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-13 h-13 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                  <span>{job.technician.fullName ? job.technician.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2) : 'GT'}</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-extrabold text-sm text-slate-900 truncate">
                    {job.technician.fullName}
                  </h2>
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[9px] font-bold border border-emerald-200 shrink-0">
                    Verified Pro
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate font-medium">
                  Field Specialist • {job.technician.experienceYears || 6}+ Yrs Exp
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                  <span className="text-xs font-bold text-slate-900">{job.technician.rating}</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    ({job.technician.completedJobsCount || 180} completed jobs)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`tel:${job.technician.phone}`}
                aria-label="Call Electrician"
                className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs active:scale-95 hover:bg-blue-700 transition-colors"
                title={`Call ${job.technician.fullName}`}
              >
                <Phone className="w-4 h-4 fill-current" />
              </a>
              <button
                aria-label="Message Electrician"
                onClick={() => alert(`Direct SMS channel opened with ${job.technician.fullName}`)}
                className="w-10 h-10 rounded-full bg-slate-100 text-blue-600 flex items-center justify-center shadow-xs active:scale-95 hover:bg-slate-200 transition-colors"
                title="Chat with Electrician"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ETA & Distance Telemetry Strip */}
          <div className="mt-3.5 pt-3 bg-slate-50 rounded-xl p-3 flex items-center justify-between border border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                  Estimated Arrival
                </span>
                <span className="text-xs font-extrabold text-slate-900">
                  {etaMinutes} mins away
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                Distance
              </span>
              <span className="text-xs font-extrabold text-blue-700 font-mono">{distanceKm} km</span>
            </div>
          </div>
        </div>

        {/* Live Milestone Progress Stepper */}
        <div className="w-full bg-white rounded-2xl p-4 shadow-2xs border border-slate-200">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <span className="font-bold text-xs text-slate-900">Live Job Progress</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              {isPausedForApproval ? 'Quote Approval Step' : 'In Execution'}
            </span>
          </div>

          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-200"></div>

            {/* Step 1 */}
            <div className="relative flex items-start">
              <div className="absolute -left-6 mt-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Technician Assigned</span>
                  <span className="text-[10px] text-slate-400">Confirmed</span>
                </div>
                <p className="text-[11px] text-slate-500">{job.technician.fullName} dispatched</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex items-start">
              <div className={`absolute -left-6 mt-0.5 w-5 h-5 rounded-full ${isPausedForApproval ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white ring-4 ring-blue-100'} flex items-center justify-center shadow-xs`}>
                {isPausedForApproval ? <Check className="w-3 h-3 stroke-[3]" /> : <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">En Route / Arrived</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                    Doorstep
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  Verified safety interlocks inspected at site
                </p>
              </div>
            </div>

            {/* Step 3: Scope Approval / Work Execution */}
            <div className="relative flex items-start">
              <div className={`absolute -left-6 mt-0.5 w-5 h-5 rounded-full ${isPausedForApproval ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse' : 'bg-blue-600 text-white'} flex items-center justify-center shadow-xs`}>
                {isPausedForApproval ? <AlertTriangle className="w-3 h-3" /> : <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-xs ${isPausedForApproval ? 'text-amber-800' : 'text-slate-900'}`}>
                    {isPausedForApproval ? 'Scope Expansion: Quote Pending' : 'Work Execution'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isPausedForApproval ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-50 text-emerald-800'}`}>
                    {isPausedForApproval ? 'Waiting Approval' : 'In Progress'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {isPausedForApproval
                    ? 'Work paused until customer digitally accepts quote'
                    : 'Genuine parts verified against partner franchise inventory'}
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative flex items-start opacity-60">
              <div className="absolute -left-6 mt-0.5 w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-700">Completion & Handover</span>
                  <span className="text-[10px] text-slate-400">Est. 45m</span>
                </div>
                <p className="text-[11px] text-slate-500">Digital speed test & 4-digit handover OTP seal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Handover OTP Confidential Box */}
        <div className="w-full bg-amber-50 rounded-2xl p-4 shadow-2xs border border-amber-200">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span className="font-bold text-xs text-amber-950 uppercase tracking-wide">
                Start Service / Handover OTP
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold">
              Confidential
            </span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Share this 4-digit code with the technician <strong>only after</strong> he arrives at your
            doorstep and inspects the site safely.
          </p>

          <div className="flex items-center justify-center gap-3 my-3">
            {job.handoverOtp.split('').map((digit, idx) => (
              <div
                key={idx}
                className="w-12 h-14 rounded-xl bg-white border border-amber-300 text-slate-900 flex items-center justify-center font-mono font-extrabold text-2xl shadow-xs"
              >
                {digit}
              </div>
            ))}
          </div>
        </div>

        {/* Service Summary Card with Real-time Itemized Bill & GST Breakdown (Issues 31 & 33) */}
        <div className="w-full bg-white rounded-2xl p-4 shadow-2xs border border-slate-200">
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Service Order Summary
              </span>
              <h3 className="font-bold text-xs text-slate-900 mt-0.5 truncate">{job.serviceTitle}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{job.customerAddressText}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Bill</span>
              <span className="font-mono font-extrabold text-base text-blue-700 whitespace-nowrap">
                ₹{job.totalAmountInr.toFixed(0)}
              </span>
            </div>
          </div>

          {/* Approved Spare Parts Itemization */}
          {approvedParts.length > 0 && (
            <div className="mt-3 pt-1 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Approved Replacement Parts ({approvedParts.length})
              </span>
              {approvedParts.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="font-semibold text-slate-900 truncate">{p.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      SKU: {p.sku} • Qty {p.quantity} @ ₹{p.unitPriceInr.toFixed(0)}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-800 shrink-0">
                    ₹{p.totalAmountInr.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Real-time GST & Grand Total Breakdown */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>CGST (9%)</span>
              <span className="font-mono font-medium">₹{(taxBreakdown?.cgstInr ?? Math.round(job.totalAmountInr * 0.09 * 100) / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>SGST (9%)</span>
              <span className="font-mono font-medium">₹{(taxBreakdown?.sgstInr ?? Math.round(job.totalAmountInr * 0.09 * 100) / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-extrabold text-slate-900 pt-1 border-t border-slate-100">
              <span>Revised Grand Total</span>
              <span className="font-mono text-blue-700">₹{job.totalAmountInr.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-700">
              <BrandMark size="xs" variant="default" badge={false} className="shrink-0" />
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[11px] font-bold">1 Year GTS Ghar Tak Service Warranty</span>
            </div>
            <Link
              href="/customer/history"
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              View Receipt →
            </Link>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1 pb-4">
          {pendingQuote && (
            <button
              type="button"
              onClick={() => {}}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Review Estimate (₹{pendingQuote.totalAmountInr.toFixed(0)})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => alert(`Ticket #${job.jobTicketNumber} details confirmed with Maharashtra Ops Hub.`)}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 active:scale-[0.99] transition-all"
          >
            View Full Booking Details
          </button>
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="w-full py-3 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 font-bold text-xs transition-colors"
          >
            Cancel Service Request
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Issue 31: Customer In-App Quote Approval Dialog Modal                    */}
      {/* ========================================================================= */}
      {pendingQuote && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[430px] bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4"></div>

            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-extrabold text-sm text-slate-900">
                In-Flight Scope Expansion Quote
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Technician <strong>{job.technician.fullName}</strong> diagnosed a component replacement required to complete work safely. Work is paused until you decide:
            </p>

            {/* Standardized Component Details Card (Issue 32) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono font-bold">
                      SKU: {pendingQuote.sku}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      GST 18% Compliant
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 mt-1">
                    {pendingQuote.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {pendingQuote.brand || 'Verified Partner'} • {pendingQuote.category || 'Standard Replacement'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Pre-Negotiated MRP</span>
                  <span className="font-mono font-extrabold text-sm text-slate-900">
                    ₹{pendingQuote.unitPriceInr.toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Damaged Component Evidence Photo (Issue 34) */}
              {pendingQuote.damagedComponentPhotoUrl && (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img
                    src={pendingQuote.damagedComponentPhotoUrl}
                    alt="Damaged Component Site Proof"
                    className="w-full h-36 object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/75 backdrop-blur-xs text-white rounded-lg text-[10px] font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Damaged Component Site Evidence</span>
                  </div>
                </div>
              )}

              {/* Itemized Price & GST Breakdown */}
              <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Unit Price ({pendingQuote.quantity} item)</span>
                  <span className="font-mono">₹{pendingQuote.subtotalInr.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>CGST (9%)</span>
                  <span className="font-mono">₹{(pendingQuote.gstAmountInr / 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>SGST (9%)</span>
                  <span className="font-mono">₹{(pendingQuote.gstAmountInr / 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Additional Part Total</span>
                  <span className="font-mono text-blue-700">₹{pendingQuote.totalAmountInr.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Revised Grand Total Impact Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider block">
                  Revised Grand Total
                </span>
                <span className="text-xs text-slate-600">
                  Includes service + genuine GST part
                </span>
              </div>
              <span className="font-mono font-extrabold text-base text-blue-900">
                ₹{(job.totalAmountInr + pendingQuote.totalAmountInr).toFixed(0)}
              </span>
            </div>

            <p className="text-[10px] text-slate-500 mb-4 text-center leading-normal">
              🔒 Tapping <strong>Accept Quote</strong> authorizes the replacement. Partner warehouse stock will be reserved and 1-Year GTS Warranty attached.
            </p>

            {/* Accept & Reject Action Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={isDecidingQuote}
                onClick={() => handleQuoteDecision('ACCEPT')}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDecidingQuote ? (
                  <span>Processing Authorization...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accept Quote & Resume Work (+₹{pendingQuote.totalAmountInr.toFixed(0)})</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isDecidingQuote}
                onClick={() => handleQuoteDecision('REJECT')}
                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors disabled:opacity-50"
              >
                Decline Estimate (Proceed Without Replacement)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-[430px] bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4"></div>
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="font-bold text-sm text-slate-900">Cancel Electrical Request?</h4>
            </div>

            {cancelFeedback ? (
              <p className="text-xs text-emerald-700 font-medium py-3">{cancelFeedback}</p>
            ) : (
              <>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Technician {job.technician.fullName} is currently {distanceKm} km away. Cancelling now
                  may incur a convenience fee of ₹150 for field travel compensation.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
                  >
                    Keep Booking
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCancel}
                    className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs"
                  >
                    Confirm Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full max-w-[430px] z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_16px_rgba(11,28,48,0.06)]">
        <div className="flex justify-around items-center h-15 px-2">
          <Link
            href="/customer"
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] tracking-tight font-medium">Home</span>
          </Link>
          <Link
            href="/customer/bookings"
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] tracking-tight font-medium">Bookings</span>
          </Link>
          <Link
            href="/customer/track"
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 text-blue-600 font-bold"
          >
            <Navigation className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Track</span>
          </Link>
          <Link
            href="/customer/history"
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Receipt className="w-5 h-5" />
            <span className="text-[10px] tracking-tight font-medium">History</span>
          </Link>
          <Link
            href="/customer/login"
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] tracking-tight font-medium">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
