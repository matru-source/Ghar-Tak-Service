'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Zap,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Phone,
  Lock,
  MapPin,
  ChevronRight,
  RefreshCw,
  Sparkles,
} from '@/components/ui/icons';
import { BrandLogo, BrandMark } from '@/components/ui/brand-logo';

type Step = 'PHONE' | 'OTP' | 'LOCATION';

export default function CustomerLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('PHONE');
  const [phone, setPhone] = useState('9876543213');
  const [otp, setOtp] = useState(['1', '2', '3', '4', '5', '6']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(30);
  const [devOtpReceived, setDevOtpReceived] = useState<string | null>('123456');

  // Location onboarding options
  const [selectedPincode, setSelectedPincode] = useState('400001');
  const [selectedArea, setSelectedArea] = useState('Colaba, Mumbai Hub');
  const [addressLine, setAddressLine] = useState('Flat 402, Sea View Apartments, Colaba, Mumbai');

  // Resend countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'OTP' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Handle Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanInput = phone.replace(/\D/g, '');
    if (cleanInput.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setLoading(true);
    const fullPhone = `+91${cleanInput}`;

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP code');
      }

      setDevOtpReceived(data.data?.devOtp || '123456');
      setSuccessMsg(`OTP sent to ${fullPhone}. Use code: ${data.data?.devOtp || '123456'}`);
      setResendTimer(30);
      setStep('OTP');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit input
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto advance focus
    if (digit && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Quick fill demo OTP
  const handleQuickFillOtp = () => {
    const target = devOtpReceived || '123456';
    setOtp(target.split('').slice(0, 6));
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 6) {
      setError('Please enter the full 6-digit OTP code');
      return;
    }

    setLoading(true);
    const fullPhone = `+91${phone.replace(/\D/g, '')}`;

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fullPhone,
          otp: enteredOtp,
          role: 'CUSTOMER',
          fullName: 'Amit Sharma',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Store authenticated session
      const customerData = {
        id: data.data?.customerId || 'cust_amit_01',
        token: data.data?.token,
        userId: data.data?.user?.id || 'usr_cust_01',
        fullName: data.data?.user?.fullName || 'Amit Sharma',
        phone: fullPhone,
        email: data.data?.user?.email || 'amit.sharma@gmail.com',
        defaultAddressLine: addressLine,
        defaultPincode: selectedPincode,
        isLoggedIn: true,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('electriCare_customer_session', JSON.stringify(customerData));
      }

      setSuccessMsg('Phone verified successfully!');
      setStep('LOCATION');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  // Handle Complete Onboarding & Save Location
  const handleCompleteOnboarding = () => {
    if (typeof window !== 'undefined') {
      const existing = localStorage.getItem('electriCare_customer_session');
      if (existing) {
        const parsed = JSON.parse(existing);
        parsed.defaultPincode = selectedPincode;
        parsed.defaultAddressLine = addressLine;
        localStorage.setItem('electriCare_customer_session', JSON.stringify(parsed));
      }
    }
    router.push('/customer');
  };

  return (
    <div className="flex-1 flex flex-col bg-white text-slate-900 px-6 py-6 overflow-y-auto">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <BrandLogo variant="on-light" size="sm" priority />
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            CUSTOMER APP
          </span>
        </div>

        <Link
          href="/customer"
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          Skip to Home →
        </Link>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-2 py-6">
        <div className={`h-1.5 rounded-full transition-all ${step === 'PHONE' ? 'w-8 bg-blue-600' : 'w-2 bg-blue-200'}`} />
        <div className={`h-1.5 rounded-full transition-all ${step === 'OTP' ? 'w-8 bg-blue-600' : 'w-2 bg-blue-200'}`} />
        <div className={`h-1.5 rounded-full transition-all ${step === 'LOCATION' ? 'w-8 bg-blue-600' : 'w-2 bg-blue-200'}`} />
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* STEP 1: PHONE NUMBER INPUT */}
      {step === 'PHONE' && (
        <div className="flex-1 flex flex-col justify-between animate-in fade-in slide-in-from-right duration-200">
          <div>
            <div className="mb-6">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold mb-2">
                <Sparkles className="w-3 h-3 text-blue-600" />
                Step 1 of 3: Verification
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enter your phone number</h1>
              <p className="text-sm text-slate-500 mt-1">
                We'll send a 6-digit one-time password to verify your account and dispatch electricians.
              </p>
            </div>

            {/* Quick Demo Fill Pill */}
            <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs text-slate-700 font-medium">Test Persona: Amit Sharma</span>
              </div>
              <button
                type="button"
                onClick={() => setPhone('9876543213')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-xs"
              >
                Use Preset
              </button>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Mobile Number
                </label>
                <div className="flex rounded-xl border-2 border-slate-200 focus-within:border-blue-600 transition-colors overflow-hidden shadow-xs">
                  <div className="bg-slate-50 px-3.5 py-3.5 border-r border-slate-200 flex items-center gap-1.5 text-slate-700 font-bold text-sm select-none">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="98765 43213"
                    className="flex-1 px-3.5 py-3.5 text-slate-900 font-bold text-base outline-none bg-white placeholder:text-slate-400 placeholder:font-normal"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Get Verification Code</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>256-Bit Banking Grade Security • Zero Spam Guarantee</span>
            </div>
            <p className="text-[11px] text-slate-400">
              By continuing, you agree to ElectriCare Terms of Service & Electrical Safety Protocols.
            </p>
          </div>
        </div>
      )}

      {/* STEP 2: 6-DIGIT OTP VERIFICATION */}
      {step === 'OTP' && (
        <div className="flex-1 flex flex-col justify-between animate-in fade-in slide-in-from-right duration-200">
          <div>
            <div className="mb-6">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold mb-2">
                <Lock className="w-3 h-3 text-blue-600" />
                Step 2 of 3: Security Code
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enter 6-digit OTP</h1>
              <p className="text-sm text-slate-500 mt-1">
                Sent to <strong className="text-slate-800">+91 {phone}</strong>.{' '}
                <button
                  type="button"
                  onClick={() => setStep('PHONE')}
                  className="text-blue-600 font-semibold underline"
                >
                  Edit
                </button>
              </p>
            </div>

            {/* Dev Demo OTP notification */}
            <div className="mb-6 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">Developer Sandbox Code</p>
                <p className="text-xs font-mono font-bold text-amber-800">
                  {devOtpReceived || '123456'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleQuickFillOtp}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
              >
                Auto-Fill Code
              </button>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex justify-between gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !digit && idx > 0) {
                        const prev = document.getElementById(`otp-input-${idx - 1}`);
                        prev?.focus();
                      }
                    }}
                    className="w-12 h-14 text-center text-xl font-extrabold rounded-xl border-2 border-slate-200 focus:border-blue-600 focus:bg-blue-50/30 text-slate-900 outline-none transition-all shadow-xs"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Resend Timer */}
            <div className="mt-4 text-center">
              {resendTimer > 0 ? (
                <p className="text-xs text-slate-500">
                  Resend code in <strong className="text-slate-800">{resendTimer}s</strong>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Resend OTP Code via SMS
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 pt-4 text-center">
            <button
              type="button"
              onClick={() => setStep('PHONE')}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              ← Back to phone entry
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: LOCATION PERMISSION & ADDRESS CONFIRMATION */}
      {step === 'LOCATION' && (
        <div className="flex-1 flex flex-col justify-between animate-in fade-in slide-in-from-right duration-200">
          <div>
            <div className="mb-6">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold mb-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Step 3 of 3: Location Setup
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Allow Location Access</h1>
              <p className="text-sm text-slate-500 mt-1">
                Required for 15-minute emergency technician dispatch and precise GPS arrival tracking.
              </p>
            </div>

            {/* Permission Prompt Card */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 mb-6 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <MapPin className="w-5 h-5 fill-current" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-slate-900">Current Pincode Detected</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Mumbai Central Territory • Active Fleet Coverage: <strong>8 Verified Techs Online</strong>
                </p>
              </div>
            </div>

            {/* Hyperlocal Territory Picker */}
            <div className="space-y-3 mb-6">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Service Territory
              </label>

              {[
                { pin: '400001', area: 'Colaba, Mumbai Hub', eta: '15 Mins Guaranteed', active: true },
                { pin: '400005', area: 'Cuffe Parade & Colaba Post Office', eta: '18 Mins', active: true },
                { pin: '400020', area: 'Churchgate & Marine Drive Sector', eta: '20 Mins', active: true },
              ].map((item) => (
                <div
                  key={item.pin}
                  onClick={() => {
                    setSelectedPincode(item.pin);
                    setSelectedArea(item.area);
                  }}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    selectedPincode === item.pin
                      ? 'border-blue-600 bg-blue-50/30 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedPincode === item.pin ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                      }`}
                    >
                      {selectedPincode === item.pin && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">
                        {item.pin} • {item.area}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-medium">⚡ ETA: {item.eta}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Live
                  </span>
                </div>
              ))}
            </div>

            {/* Address Line Editor */}
            <div className="space-y-1.5 mb-6">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Delivery Address Line
              </label>
              <input
                type="text"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="Flat / Floor / Society / Street"
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:border-blue-600 text-sm font-medium text-slate-900 outline-none"
              />
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleCompleteOnboarding}
              className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
            >
              <span>Confirm Location & Enter Dashboard</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-3">
              You can change your delivery address anytime from the top bar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
