'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Lock,
  Unlock,
  Key,
  Zap,
  Check,
  X,
  Info,
} from '@/components/ui/icons';

interface SafetyCheckItem {
  id: string;
  title: string;
  code: string;
  codeColor: string;
  description: string;
  checked: boolean;
}

function TechSafetyChecklistContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('id') || 'J-1001';

  // 4-Digit OTP State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Safety Checklist State (4 Mandatory Industrial Protocols)
  const [safetyItems, setSafetyItems] = useState<SafetyCheckItem[]>([
    {
      id: 'gloves',
      title: '1000V Insulated Gloves',
      code: 'IEC 60900',
      codeColor: 'bg-slate-100 text-slate-700',
      description: 'VDE Certified class 0 dry gloves inspected for micro-punctures before physical contact.',
      checked: false,
    },
    {
      id: 'zero_test',
      title: 'AC Voltage Zero-Test',
      code: 'Live-Dead-Live',
      codeColor: 'bg-slate-100 text-slate-700',
      description: 'Verified calibrated multimeter shows 0.0V between Phase-Neutral, Phase-Earth on target switchbox.',
      checked: false,
    },
    {
      id: 'mcb_lockout',
      title: 'Main MCB Locked & Tagged',
      code: 'Lockout',
      codeColor: 'bg-red-50 text-red-700 border border-red-200',
      description: 'Distribution feeder breaker flipped to OFF, mechanical safety clip or warning tag affixed.',
      checked: false,
    },
    {
      id: 'rubber_mat',
      title: 'Ground Insulated Rubber Mat',
      code: 'Class A',
      codeColor: 'bg-slate-100 text-slate-700',
      description: 'Dielectric mat deployed beneath work ladder; standing surface entirely cleared of moisture.',
      checked: false,
    },
  ]);

  // Evidence Photo State
  const [hasBeforePhoto, setHasBeforePhoto] = useState<boolean>(true);
  const [evidencePhotoUrl, setEvidencePhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80'
  );
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // Submission / Verification State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // SOS Emergency Modal State
  const [isSosModalOpen, setIsSosModalOpen] = useState<boolean>(false);

  // Computed Interlocks
  const isOtpComplete = otpDigits.every((d) => d.length === 1 && /^\d$/.test(d));
  const checkedCount = safetyItems.filter((item) => item.checked).length;
  const isSafetyComplete = checkedCount === 4;
  const isInterlockCleared = isOtpComplete && isSafetyComplete && hasBeforePhoto;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // OTP auto-advance & backspace handler
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    setErrorMessage(null);

    if (digit && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasteData.length > 0) {
      const newDigits = ['', '', '', ''];
      for (let i = 0; i < pasteData.length; i++) {
        newDigits[i] = pasteData[i];
      }
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pasteData.length, 3);
      otpInputRefs.current[nextIndex]?.focus();
    }
  };

  const autofillDemoOtp = () => {
    setOtpDigits(['2', '4', '6', '8']);
    showToast('Customer Start OTP "2468" auto-filled for testing');
  };

  const toggleSafetyItem = (id: string) => {
    setSafetyItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const checkAllSafety = () => {
    setSafetyItems((prev) => prev.map((item) => ({ ...item, checked: true })));
    showToast('All 4 Industrial Protocols certified');
  };

  // Simulated Photo Retake / Switch
  const handleRetakePhoto = () => {
    setIsCapturing(true);
    setTimeout(() => {
      setEvidencePhotoUrl(
        'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=800&auto=format&fit=crop&q=80'
      );
      setHasBeforePhoto(true);
      setIsCapturing(false);
      showToast('📷 New geo-tagged photo captured & watermarked');
    }, 700);
  };

  // Main Interlock Verification Action
  const handleVerifyAndStart = async () => {
    if (!isInterlockCleared) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Call backend API if available
      const res = await fetch(`/api/jobs/${jobId}/verify-safety`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          safetyGlovesConfirmed: true,
          safetyMcbSwitchConfirmed: true,
          beforePhotoUrl: evidencePhotoUrl,
        }),
      });

      if (!res.ok) {
        // If job ID in DB is job_1001 or simulated, handle gracefully
        const errData = await res.json().catch(() => ({}));
        console.warn('Backend response:', errData);
      }

      setIsSuccess(true);
      showToast('✓ Safety Interlock Cleared! Work Authorized.');

      setTimeout(() => {
        router.push(`/tech/complete?id=${jobId}`);
      }, 1000);
    } catch (err) {
      console.error('Safety verify error:', err);
      // Fallback for seamless demo
      setIsSuccess(true);
      setTimeout(() => {
        router.push(`/tech/complete?id=${jobId}`);
      }, 1000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 text-slate-900 pb-36 relative select-none">
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
            onClick={() => router.push(`/tech/job?id=${jobId}`)}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors shrink-0"
            aria-label="Back to Navigation"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="font-bold text-sm sm:text-base text-slate-900 truncate">
              Safety Verification Checklist
            </h1>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <span>TECH-SCR-03</span>
              <span>•</span>
              <span className="text-orange-600 font-semibold">Pre-Execution Interlock</span>
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

      {/* Status & Pipeline Banner */}
      <div className="bg-white border-b border-slate-200 px-4 pt-3.5 pb-4 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse"></span>
              Arrived on Site
            </span>
            <span className="text-xs font-semibold text-slate-500 font-mono">#{jobId}</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-700 text-xs font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>ISO 45001 Certified</span>
          </div>
        </div>

        <div className="flex items-baseline justify-between mb-3.5">
          <div>
            <h2 className="font-extrabold text-base text-slate-900">Amit Sharma</h2>
            <p className="text-xs text-slate-500">Colaba, South Mumbai • Flat 402 Sea Green</p>
          </div>
          <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60">
            Fan Install & Balancing
          </span>
        </div>

        {/* 3-Step Process Stepper */}
        <div className="pt-1">
          <div className="flex items-center justify-between relative">
            {/* Step 1: Doorstep (Completed) */}
            <div className="flex flex-col items-center gap-1 z-10">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <span className="text-[10px] font-bold text-emerald-700">Doorstep</span>
            </div>

            {/* Connecting Bar 1 */}
            <div className="flex-1 h-0.5 mx-2 bg-orange-500"></div>

            {/* Step 2: Safety Audit (Active) */}
            <div className="flex flex-col items-center gap-1 z-10">
              <div className="w-7 h-7 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-md ring-2 ring-orange-200">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold text-orange-700">Safety Audit</span>
            </div>

            {/* Connecting Bar 2 */}
            <div className="flex-1 h-0.5 mx-2 bg-slate-200"></div>

            {/* Step 3: Execution (Pending) */}
            <div className="flex flex-col items-center gap-1 z-10">
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-semibold text-slate-400">Execution</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 pt-4 space-y-4">
        {/* SECTION 1: Customer Start OTP */}
        <div className="rounded-2xl bg-white p-4 shadow-xs border border-slate-200 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-orange-700">
                <Key className="w-4 h-4 text-orange-600" />
                <h3 className="font-bold text-sm text-slate-900">Enter Customer Start OTP</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ask client <strong className="text-slate-800">Amit Sharma</strong> for the 4-digit token generated on their phone.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-100 text-red-700 uppercase tracking-wide border border-red-200">
              Mandatory
            </span>
          </div>

          {/* OTP Digit Input Boxes */}
          <div className="flex items-center justify-center gap-3 my-1" id="otp-group" onPaste={handleOtpPaste}>
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  otpInputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                className={`w-13 h-14 text-center font-black text-2xl rounded-xl border transition-all outline-none ${
                  digit
                    ? 'border-orange-500 bg-orange-50/40 text-orange-900 shadow-xs'
                    : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-200'
                }`}
                aria-label={`OTP Digit ${idx + 1}`}
              />
            ))}
          </div>

          {/* Quick Demo Helper Pill */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-slate-500 text-[11px]">Demo client token is <strong>2468</strong></span>
            <button
              type="button"
              onClick={autofillDemoOtp}
              className="px-2.5 py-1 rounded bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold text-[11px] border border-orange-200 transition-colors"
            >
              Auto-fill OTP
            </button>
          </div>

          {/* Mandatory Insurance Warning Note */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 text-xs">
            <Lock className="w-4 h-4 text-red-600 shrink-0" />
            <span className="text-[11px] leading-tight">
              Never start work without client OTP verification. Insurance and warranty are strictly void without it.
            </span>
          </div>
        </div>

        {/* SECTION 2: Mandatory Industrial Protocol Checklist */}
        <div className="rounded-2xl bg-white p-4 shadow-xs border border-slate-200 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-600" />
              <h3 className="font-bold text-sm text-slate-900">Mandatory Industrial Protocol</h3>
            </div>
            <span
              id="safety-progress"
              className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                isSafetyComplete
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {checkedCount} / 4 Cleared
            </span>
          </div>

          {/* Shield Policy Alert */}
          <div className="p-3 rounded-xl bg-red-50 text-red-900 border border-red-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-extrabold text-red-800">ElectriCare Shield Safety Policy: </span>
              Live telemetry audits safety checkpoints. Bypassing mandatory PPE or MCB lockout triggers instant job abort & partner suspension.
            </div>
          </div>

          {/* Checklist Items */}
          <div className="space-y-2.5 pt-1">
            {safetyItems.map((item) => (
              <label
                key={item.id}
                onClick={() => toggleSafetyItem(item.id)}
                className={`cursor-pointer select-none rounded-xl p-3 flex items-start gap-3 border transition-all ${
                  item.checked
                    ? 'bg-emerald-50/50 border-emerald-300 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => {}} // handled by parent onClick
                  className="mt-1 w-5 h-5 rounded accent-orange-600 cursor-pointer"
                />
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs text-slate-900">{item.title}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${item.codeColor}`}>
                      {item.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    {item.description}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {/* Check All Demo Button */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={checkAllSafety}
              className="text-[11px] font-semibold text-orange-700 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 px-3 py-1 rounded-lg border border-orange-200 transition-colors"
            >
              ✓ Certify All 4 Safety Checks (Demo)
            </button>
          </div>
        </div>

        {/* SECTION 3: Pre-Work Evidence Capture (Before Photo) */}
        <div className="rounded-2xl bg-white p-4 shadow-xs border border-slate-200 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-orange-600" />
              <h3 className="font-bold text-sm text-slate-900">Pre-Work Evidence Capture</h3>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              1 Geo-Photo Attached
            </span>
          </div>

          {/* Photo Frame with Telemetry Watermark */}
          <div className="relative rounded-xl overflow-hidden bg-slate-900 shadow-sm border border-slate-200 h-52">
            <img
              src={evidencePhotoUrl}
              alt="Pre-work ceiling junction electrical inspection"
              className="w-full h-full object-cover"
            />
            {isCapturing && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2">
                <span className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
                <span className="text-xs font-semibold">Capturing Geo-Tagged Telemetry...</span>
              </div>
            )}

            {/* Live Telemetry Watermark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent flex flex-col justify-end p-3 text-white pointer-events-none">
              <div className="flex items-center gap-1.5 text-orange-300 text-xs font-medium mb-0.5">
                <Zap className="w-3.5 h-3.5 text-orange-400" />
                <span>18.9220° N, 72.8347° E • Colaba High St</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300">27 Aug 2026, 10:48 AM IST</span>
                <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px] tracking-wide uppercase">
                  Tamper-Proof Tagged
                </span>
              </div>
            </div>
          </div>

          {/* Evidence Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleRetakePhoto}
              disabled={isCapturing}
              className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-200 transition-colors"
            >
              <Camera className="w-4 h-4 text-slate-600" />
              <span>Retake Photo</span>
            </button>
            <button
              type="button"
              onClick={handleRetakePhoto}
              disabled={isCapturing}
              className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-200 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              <span>Re-scan Hazard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Technician Action Tray */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="max-w-md mx-auto flex flex-col gap-2">
          {/* Status Label */}
          <div className="flex items-center justify-between text-xs px-1 font-semibold">
            <span
              id="lock-label"
              className={`flex items-center gap-1.5 ${
                isInterlockCleared ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {isInterlockCleared ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Ready to execute job</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-red-500" />
                  <span>
                    Awaiting: {!isOtpComplete && 'Client OTP'}{' '}
                    {!isOtpComplete && !isSafetyComplete && '& '}{' '}
                    {!isSafetyComplete && `Safety (${checkedCount}/4)`}
                  </span>
                </>
              )}
            </span>

            <span className="text-emerald-700 flex items-center gap-1 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Fully Insured</span>
            </span>
          </div>

          {/* Interlock Action Button */}
          <button
            id="btn-verify-start"
            type="button"
            disabled={!isInterlockCleared || isSubmitting}
            onClick={handleVerifyAndStart}
            className={`w-full h-13 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white shadow-md transition-all active:scale-98 ${
              isSuccess
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : isInterlockCleared
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-orange-600/50 cursor-not-allowed opacity-50'
            }`}
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Authenticating Safety Pass...</span>
              </>
            ) : isSuccess ? (
              <>
                <Check className="w-5 h-5 stroke-[3]" />
                <span>Work Authorized • Launching...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Verify & Start Work</span>
              </>
            )}
          </button>
        </div>
      </div>

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
                This alerts the Maharashtra Regional Dispatch Hub, contacts safety supervisors, and activates police/ambulance assistance if required.
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

export default function TechSafetyChecklistPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading safety checklist...</div>}>
      <TechSafetyChecklistContent />
    </React.Suspense>
  );
}
