'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BrandLogo, BrandMark } from '@/components/ui/brand-logo';

const FRANCHISE_HUBS = [
  { id: 'MH-01', name: 'Maharashtra Regional Hub (MH-01)', state: 'Maharashtra', gstin: '27AABCU9603R1ZM' },
  { id: 'KA-01', name: 'Karnataka Regional Hub (KA-01)', state: 'Karnataka', gstin: '29AABCU9603R1ZL' },
  { id: 'DL-01', name: 'Delhi NCR Regional Hub (DL-01)', state: 'Delhi NCR', gstin: '07AABCU9603R1ZK' },
];

function RegionalPartnerLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/partner';

  const [selectedHub, setSelectedHub] = useState('MH-01');
  const [identifier, setIdentifier] = useState('operations@ghartak.in');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [licenseCode, setLicenseCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          password,
          role: 'PARTNER',
          hubId: selectedHub,
        }),
      });

      const data = await res.json();
      if (data.success && data.data?.token) {
        document.cookie = `gts_token=${data.data.token}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `gts_auth_token=${data.data.token}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `gts_user_role=PARTNER; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `gts_partner_hub=${selectedHub}; path=/; max-age=604800; SameSite=Lax`;
        localStorage.setItem('gts_token', data.data.token);
        localStorage.setItem('gts_auth_token', data.data.token);
        localStorage.setItem('gts_user', JSON.stringify(data.data.user));
        localStorage.setItem('gts_hub', selectedHub);

        showToast('✓ Franchise Verified. Launching Regional Dispatch Console...');
        setTimeout(() => {
          router.push(redirectPath);
        }, 500);
      } else {
        setErrorMessage(data.error || 'Partner franchise verification failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Connection error connecting to franchise ledger.');
    } finally {
      setLoading(false);
    }
  };

  const currentHubInfo = FRANCHISE_HUBS.find((h) => h.id === selectedHub) || FRANCHISE_HUBS[0];

  return (
    <div className="min-h-screen w-full bg-[#061612] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden text-slate-100">
      {/* Background Emerald Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-700/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-teal-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Grid Pattern Backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#064e3b10_1px,transparent_1px),linear-gradient(to_bottom,#064e3b10_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none" />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl bg-emerald-950/95 text-white text-xs font-semibold shadow-2xl border border-emerald-700/60 flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <BrandMark size="xs" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-colors duration-300 rounded-3xl p-7 sm:p-8 shadow-2xl backdrop-blur-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <BrandLogo variant="badge-light" size="md" priority />
          <div className="pt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              FRANCHISE PARTNER PORTAL
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-2.5">
              Regional Operations Hub
            </h1>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              State franchise territory fleet management, 30-min SLA dispatch & 15% revenue share.
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <span className="text-sm">⚠️</span>
            <span className="flex-1 font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Form with Standard Semantics */}
        <form onSubmit={handleLogin} method="POST" autoComplete="on" className="space-y-4">
          <div>
            <label htmlFor="partner-hub" className="block text-xs font-bold text-slate-300 mb-1.5">
              Assigned Franchise Territory Hub
            </label>
            <select
              id="partner-hub"
              value={selectedHub}
              onChange={(e) => setSelectedHub(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            >
              {FRANCHISE_HUBS.map((hub) => (
                <option key={hub.id} value={hub.id}>
                  {hub.name}
                </option>
              ))}
            </select>
            <div className="text-[10px] text-emerald-400 font-mono mt-1.5 flex items-center justify-between">
              <span>GSTIN: {currentHubInfo.gstin}</span>
              <span className="text-emerald-300/80">15% Revenue Share Active</span>
            </div>
          </div>

          <div>
            <label htmlFor="partner-identifier" className="block text-xs font-bold text-slate-300 mb-1.5">
              Hub Manager Email / Phone
            </label>
            <input
              id="partner-identifier"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="operations@ghartak.in"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="partner-password" className="text-xs font-bold text-slate-300">
                Partner Password
              </label>
              <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40">
                State Licensed
              </span>
            </div>
            <div className="relative">
              <input
                id="partner-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-4 pr-11 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="partner-license" className="block text-xs font-bold text-slate-300 mb-1.5">
              Regional Security Key / License Serial
            </label>
            <input
              id="partner-license"
              name="licenseCode"
              type="text"
              value={licenseCode}
              onChange={(e) => setLicenseCode(e.target.value)}
              placeholder="LIC-MH-2026-991"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-[0.99] text-white font-extrabold text-xs transition shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Validating State License...</span>
              </>
            ) : (
              <>
                <span>🏢</span>
                <span>Enter Regional Partner CRM</span>
              </>
            )}
          </button>
        </form>

        {/* Navigation Action */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end">
          <Link
            href="/admin/login"
            className="text-[11px] text-slate-400 hover:text-slate-200 transition flex items-center gap-1 font-semibold"
          >
            <span>Super Admin Terminal</span>
            <span>→</span>
          </Link>
        </div>

        {/* Territory Compliance Footer */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[10px] text-slate-500 text-center leading-relaxed font-mono">
          🏢 Multi-Tenant Territory Scoped. Access restricted to allocated state pincodes & licensed fleet.
        </div>
      </div>
    </div>
  );
}

export default function RegionalPartnerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#061612] flex items-center justify-center text-white">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RegionalPartnerLoginContent />
    </Suspense>
  );
}
