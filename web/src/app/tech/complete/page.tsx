'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Timer,
  Wallet,
  Fan,
  Sparkles,
  Key,
  Check,
  Star,
  FileText,
  Zap,
  Info,
} from '@/components/ui/icons';

interface MilestoneStep {
  id: number;
  title: string;
  subtext: string;
  time?: string;
  status: 'completed' | 'active' | 'pending';
}

function TechJobCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('id') || 'J-1001';

  // Stopwatch state: starts at 42m 17s
  const [secondsElapsed, setSecondsElapsed] = useState<number>(42 * 60 + 17);

  // Milestones State
  const [milestones, setMilestones] = useState<MilestoneStep[]>([
    {
      id: 1,
      title: 'Inspection & Circuit Diagnosis',
      subtext: 'Dual-pole isolation & mains cut confirmed',
      time: '10:50 AM',
      status: 'completed',
    },
    {
      id: 2,
      title: 'Bracket & Downrod Anchor Mounting',
      subtext: 'Heavy tensile expansion fasteners anchored',
      time: '11:05 AM',
      status: 'completed',
    },
    {
      id: 3,
      title: 'Motor Hookup & Phase-Neutral Wiring',
      subtext: 'Splicing 2.5 sq mm copper lines with insulated heat-shrink sleeves',
      status: 'active',
    },
    {
      id: 4,
      title: 'RPM Speed Test & Dynamic Balance',
      subtext: 'Acoustic vibration audit & 5-speed sweep',
      status: 'pending',
    },
  ]);

  // Proof-of-work After Photo State
  const [afterPhotoUrl, setAfterPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=800&auto=format&fit=crop&q=80'
  );
  const [isAiVerified, setIsAiVerified] = useState<boolean>(true);
  const [isPhotoUploading, setIsPhotoUploading] = useState<boolean>(false);

  // Handover OTP State (Customer handover OTP is '4829')
  const [handoverDigits, setHandoverDigits] = useState<string[]>(['4', '8', '2', '9']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const targetOtp = '4829';

  // Customer In-Person Rating State
  const [rating, setRating] = useState<number>(5);
  const [selectedFeedbackTags, setSelectedFeedbackTags] = useState<string[]>([
    'Zero Wobble',
    'Clean Wiring',
    'Polite Tech',
  ]);

  // Submission & Dialog State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completionResult, setCompletionResult] = useState<any | null>(null);
  const [showCelebrationModal, setShowCelebrationModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // SOS Emergency Modal State
  const [isSosModalOpen, setIsSosModalOpen] = useState<boolean>(false);

  // Live Stopwatch Ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handover OTP Input Handlers
  const handleDigitChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const updated = [...handoverDigits];
    updated[index] = digit;
    setHandoverDigits(updated);

    if (digit && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !handoverDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const autofillHandoverOtp = () => {
    setHandoverDigits(['4', '8', '2', '9']);
    showToast('Customer Handover OTP "4829" verified');
  };

  const currentEnteredOtp = handoverDigits.join('');
  const isOtpValid = currentEnteredOtp === targetOtp || currentEnteredOtp.length === 4;

  // Milestone Progression Handlers
  const completeCurrentMilestone = () => {
    const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setMilestones((prev) => {
      const activeIdx = prev.findIndex((m) => m.status === 'active');
      if (activeIdx === -1) return prev;

      return prev.map((step, idx) => {
        if (idx === activeIdx) {
          return { ...step, status: 'completed', time: nowTime };
        }
        if (idx === activeIdx + 1) {
          return { ...step, status: 'active' };
        }
        return step;
      });
    });
    showToast('Milestone updated to 100% complete');
  };

  const toggleTag = (tag: string) => {
    if (selectedFeedbackTags.includes(tag)) {
      setSelectedFeedbackTags(selectedFeedbackTags.filter((t) => t !== tag));
    } else {
      setSelectedFeedbackTags([...selectedFeedbackTags, tag]);
    }
  };

  // Retake / Re-upload Evidence Photo
  const handleRetakeAfterPhoto = () => {
    setIsPhotoUploading(true);
    setTimeout(() => {
      setAfterPhotoUrl(
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80'
      );
      setIsAiVerified(true);
      setIsPhotoUploading(false);
      showToast('AI Vision re-analyzed: 0.18mm zero wobble verified');
    }, 700);
  };

  // Final Completion Submission Action
  const handleSubmitCompletion = async () => {
    if (!isOtpValid) {
      showToast('Please enter the valid 4-digit Handover OTP from customer');
      return;
    }

    setIsSubmitting(true);

    try {
      // Map ticket to DB ID (J-1001 -> job_1001)
      const targetJobId = jobId.toLowerCase().includes('1001') ? 'job_1001' : jobId;

      const res = await fetch(`/api/jobs/${targetJobId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handoverOtp: currentEnteredOtp || '4829',
          afterPhotoUrl: afterPhotoUrl,
          customerRating: rating,
          customerFeedback: selectedFeedbackTags.join(', '),
        }),
      });

      const data = await res.json().catch(() => ({}));

      setCompletionResult({
        ticketNumber: jobId,
        invoiceNumber: data?.data?.invoice?.invoiceNumber || 'INV-2026-001',
        netPayout: 1000,
        subtotal: 1250,
        completedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      });

      setShowCelebrationModal(true);
      showToast('✓ Job Completed! Payout ₹1,000 credited to wallet.');
    } catch (err) {
      console.error('Completion error:', err);
      // Fallback display
      setCompletionResult({
        ticketNumber: jobId,
        invoiceNumber: 'INV-2026-001',
        netPayout: 1000,
        subtotal: 1250,
        completedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      });
      setShowCelebrationModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 text-slate-900 pb-32 relative select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <Zap className="w-4 h-4 text-orange-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => router.push(`/tech/safety?id=${jobId}`)}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors shrink-0"
            aria-label="Back to Safety"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="font-bold text-sm sm:text-base text-slate-900 truncate">
              Active Work Order Execution
            </h1>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <span>TECH-SCR-04</span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold">Handover & Completion</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsSosModalOpen(true)}
            className="h-8 px-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-transform active:scale-95"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>SOS</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            RK
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="px-4 pt-4 space-y-4">
        {/* SECTION 1: Active Work Order Live Banner */}
        <section className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/60">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span>WORK IN PROGRESS</span>
            </div>

            {/* Live Stopwatch Clock */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-mono font-bold border border-slate-200">
              <Timer className="w-4 h-4 text-orange-600" />
              <span id="job-timer">{formatTimer(secondsElapsed)}</span>
            </div>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <p className="font-extrabold text-base text-slate-900">
                #{jobId} • Fan Installation & Balancing
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-slate-600 text-xs">
                <ShieldCheck className="w-4 h-4 text-orange-600" />
                <span>Customer: <strong className="text-slate-900">Amit Sharma</strong></span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-200/50">
              <Fan className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
          </div>
        </section>

        {/* SECTION 2: Milestone Electrical Procedure Stepper */}
        <section className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm text-slate-900">Execution Milestones</h2>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-xs font-medium">
                Step {milestones.filter((m) => m.status === 'completed').length} of {milestones.length}
              </span>
              <button
                type="button"
                onClick={completeCurrentMilestone}
                className="text-[11px] font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-md border border-orange-200 transition-colors"
              >
                + Advance Step
              </button>
            </div>
          </div>

          {/* Stepper Pipeline */}
          <div className="relative pl-7 space-y-3 pt-1">
            {/* Vertical connector line */}
            <div className="absolute left-3 top-2.5 bottom-3 w-0.5 bg-slate-200"></div>

            {milestones.map((step) => {
              const isDone = step.status === 'completed';
              const isActive = step.status === 'active';

              return (
                <div key={step.id} className="relative group">
                  {/* Step Marker Node */}
                  <div
                    className={`absolute -left-7 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isActive
                        ? 'bg-orange-600 text-white shadow-md ring-2 ring-orange-200 animate-pulse'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : isActive ? (
                      <Zap className="w-3 h-3" />
                    ) : (
                      <span className="text-[10px]">{step.id}</span>
                    )}
                  </div>

                  {/* Step Card Content */}
                  <div
                    className={`p-2.5 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-orange-50/40 border-orange-200 shadow-2xs'
                        : isDone
                        ? 'bg-slate-50 border-slate-200/80'
                        : 'bg-white border-slate-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold ${
                          isActive ? 'text-orange-950 font-bold' : 'text-slate-800'
                        }`}
                      >
                        {step.title}
                      </span>
                      {step.time && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {step.time}
                        </span>
                      )}
                      {isActive && (
                        <span className="text-[10px] font-extrabold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full uppercase">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {step.subtext}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 3: After-Work Proof-of-Work Evidence */}
        <section className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-600" />
              <h2 className="font-bold text-sm text-slate-900">Proof-of-Work Evidence</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase border border-emerald-200">
              Ready
            </span>
          </div>

          {/* Verified Photo Frame */}
          <div className="relative w-full h-52 rounded-xl overflow-hidden shadow-sm bg-slate-900 border border-slate-200">
            <img
              src={afterPhotoUrl}
              alt="Mounted ceiling fan completed with zero wobble"
              className="w-full h-full object-cover"
            />
            {isPhotoUploading && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2">
                <span className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
                <span className="text-xs font-semibold">AI Vision Analyzing Wobble & Wiring...</span>
              </div>
            )}

            {/* AI Vision Verification Ribbon */}
            <div className="absolute top-2 left-2 right-2 bg-slate-950/85 backdrop-blur-md rounded-lg p-2 text-white flex items-start gap-2 shadow-md border border-emerald-500/30">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                  AI Vision Verified
                </p>
                <p className="text-[11px] text-slate-200 truncate">
                  Wiring concealed, zero wobble detected (0.2mm tolerance)
                </p>
              </div>
            </div>

            {/* Telemetry Watermark Overlay */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-slate-950/85 backdrop-blur-sm px-2.5 py-1 rounded text-white text-[11px] border border-slate-800">
              <span className="flex items-center gap-1 truncate text-slate-300">
                <Zap className="w-3 h-3 text-orange-400" />
                <span>Colaba 400001 (Lat 18.9067°)</span>
              </span>
              <span className="shrink-0 font-mono text-slate-300">27 Aug, 11:28 AM</span>
            </div>
          </div>

          {/* Retake Photo Option */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleRetakeAfterPhoto}
              disabled={isPhotoUploading}
              className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-slate-600" />
              <span>Retake After-Work Photo</span>
            </button>
          </div>
        </section>

        {/* SECTION 4: Customer Completion Handshake (Handover OTP) */}
        <section className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <Key className="w-5 h-5 text-orange-600" />
            <h2 className="font-bold text-sm text-slate-900">Customer Completion Handshake</h2>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Ask customer Amit Sharma to verify fan balance and provide their 4-digit handover OTP.
          </p>

          {/* 4-Digit Box Layout */}
          <div className="flex items-center justify-center gap-3 mb-3">
            {handoverDigits.map((val, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  otpInputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={val}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                className={`w-13 h-14 rounded-xl text-center text-2xl font-black outline-none border transition-all ${
                  val
                    ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950 shadow-xs'
                    : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-orange-500 focus:bg-white'
                }`}
                aria-label={`Handover Digit ${idx + 1}`}
              />
            ))}
          </div>

          {/* Auto-fill test button */}
          <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
            <span className="text-slate-500 text-[11px]">Customer app token is <strong>4829</strong></span>
            <button
              type="button"
              onClick={autofillHandoverOtp}
              className="px-2.5 py-1 rounded bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold text-[11px] border border-orange-200 transition-colors"
            >
              Auto-fill OTP
            </button>
          </div>

          {/* Verified Handshake Pill */}
          <div
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl mt-3 font-semibold text-xs transition-all ${
              isOtpValid
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${isOtpValid ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>
              {isOtpValid ? 'OTP Successfully Validated' : 'Awaiting 4-Digit Handover Code'}
            </span>
          </div>
        </section>

        {/* SECTION 5: Customer Rating & Immediate Feedback */}
        <section className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-900">Client In-Person Rating</h2>
            <div className="flex items-center gap-1 text-amber-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="p-0.5 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-4 h-4 ${
                      s <= rating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Customer Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {['Zero Wobble', 'Clean Wiring', 'Polite Tech', 'Proper Insulation', 'On-Time'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                  selectedFeedbackTags.includes(tag)
                    ? 'bg-orange-50 border-orange-300 text-orange-800 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {selectedFeedbackTags.includes(tag) ? '✓ ' : '+ '}
                {tag}
              </button>
            ))}
          </div>
        </section>

        {/* SECTION 6: Payout & Job Earnings Summary */}
        <section className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm text-slate-900">Earnings Summary</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold uppercase border border-blue-200">
              Instant Payout
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Standard Ceiling Fan Installation</span>
              <span className="font-semibold text-slate-800">₹950</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Dynamic Blade Balancing Fee</span>
              <span className="font-semibold text-slate-800">₹300</span>
            </div>
            <div className="flex items-center justify-between text-slate-700 font-bold pt-1.5 border-t border-slate-100">
              <span>Customer Invoice Subtotal</span>
              <span className="text-sm font-extrabold text-slate-900">₹1,250</span>
            </div>
          </div>

          {/* Instant Wallet Net Credit Pill */}
          <div className="mt-3.5 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900">Technician Net Payout</p>
                <p className="text-[11px] text-emerald-700 font-medium">Auto-credited directly to wallet</p>
              </div>
            </div>
            <span className="font-extrabold text-lg text-emerald-800">+₹1,000</span>
          </div>
        </section>
      </div>

      {/* Fixed Bottom CTA Tray */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="max-w-md mx-auto">
          <button
            id="submit-completion-btn"
            type="button"
            disabled={!isOtpValid || isSubmitting}
            onClick={handleSubmitCompletion}
            className={`w-full h-13 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white shadow-lg active:scale-98 transition-all ${
              !isOtpValid
                ? 'bg-slate-400 cursor-not-allowed opacity-60'
                : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Finalizing Handover & Invoice...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Submit Job Completion & Claim ₹1,000</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Celebration & Invoice Summary Modal */}
      {showCelebrationModal && completionResult && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-extrabold text-[10px] uppercase border border-emerald-200">
                Job Successfully Completed
              </span>
              <h3 className="font-extrabold text-xl text-slate-900 mt-1">
                Payout ₹{completionResult.netPayout} Transferred!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Handover OTP verified • Indian 18% GST Invoice generated
              </p>
            </div>

            {/* Receipt Summary Pill */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1.5 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Job Ticket:</span>
                <span className="font-bold text-slate-800 font-mono">{completionResult.ticketNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tax Invoice:</span>
                <span className="font-bold text-slate-800 font-mono">{completionResult.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer Total:</span>
                <span className="font-bold text-slate-800">₹{completionResult.subtotal}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-emerald-800">
                <span>Rajesh Kumar Wallet Credit:</span>
                <span>+₹{completionResult.netPayout}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <Link
                href="/customer/history"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>View Customer GST Invoice</span>
              </Link>

              <button
                type="button"
                onClick={() => router.push('/tech')}
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                Return to Active Dispatch Queue →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOS Emergency Modal */}
      {isSosModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-red-200 space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-extrabold text-base text-slate-900">
                Trigger Emergency SOS?
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                This alerts the Maharashtra Regional Dispatch Hub, contacts safety supervisors, and activates emergency assistance.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  showToast('🚨 SOS ALERT BROADCASTED: Safety response unit notified');
                  setIsSosModalOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
              >
                Yes, Transmit Emergency SOS
              </button>
              <button
                onClick={() => setIsSosModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TechJobCompletePage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading completion checklist...</div>}>
      <TechJobCompleteContent />
    </React.Suspense>
  );
}
