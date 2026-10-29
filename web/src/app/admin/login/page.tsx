'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrandLogo, BrandMark } from '@/components/ui/brand-logo';

function SuperAdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/admin';

  const [identifier, setIdentifier] = useState('admin@ghartak.in');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
          role: 'SUPER_ADMIN',
        }),
      });

      const data = await res.json();
      if (data.success && data.data?.token) {
        // Dual storage: HttpOnly cookie set by server + localStorage for client APIs
        document.cookie = `gts_token=${data.data.token}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `gts_auth_token=${data.data.token}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `gts_user_role=SUPER_ADMIN; path=/; max-age=604800; SameSite=Lax`;
        localStorage.setItem('gts_token', data.data.token);
        localStorage.setItem('gts_auth_token', data.data.token);
        localStorage.setItem('gts_user_role', 'SUPER_ADMIN');
        localStorage.setItem('gts_user', JSON.stringify(data.data.user));

        showToast('✓ Authentication Successful. Establishing National Terminal Session...');
        setTimeout(() => {
          router.push(redirectPath);
        }, 500);
      } else {
        setErrorMessage(data.error || 'Authentication rejected. Check credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Connection error contacting central auth cluster.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0d18] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden text-slate-100">
      {/* Background Ambient Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Grid Pattern Backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b076410_1px,transparent_1px),linear-gradient(to_bottom,#3b076410_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none" />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl bg-purple-950/95 text-white text-xs font-semibold shadow-2xl border border-purple-700/60 flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <BrandMark size="xs" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Login Card — Edge-to-Edge standalone container */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 transition-colors duration-300 rounded-3xl p-7 sm:p-8 shadow-2xl backdrop-blur-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <BrandLogo variant="badge-light" size="md" priority />
          <div className="pt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              SUPER ADMIN TERMINAL
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-2.5">
              National Operations Command
            </h1>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Authorized personnel only. Multi-state electrical dispatch & central treasury clearance.
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
            <label htmlFor="admin-identifier" className="block text-xs font-bold text-slate-300 mb-1.5">
              National Admin Identifier
            </label>
            <input
              id="admin-identifier"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="admin@ghartak.in"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="admin-password" className="text-xs font-bold text-slate-300">
                Master Security Passphrase
              </label>
              <span className="text-[10px] text-purple-400 font-semibold px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-800/40">
                Enterprise Encrypted
              </span>
            </div>
            <div className="relative">
              <input
                id="admin-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-4 pr-11 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-600 hover:to-indigo-600 active:scale-[0.99] text-white font-extrabold text-xs transition shadow-lg shadow-purple-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Authenticating National Node...</span>
              </>
            ) : (
              <>
                <span>🔐</span>
                <span>Authenticate & Launch Terminal</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SuperAdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0d18] flex items-center justify-center text-white">
          <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SuperAdminLoginContent />
    </Suspense>
  );
}
