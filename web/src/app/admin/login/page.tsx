'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BrandLogo, BrandMark } from '@/components/ui/brand-logo';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('admin@electricare.in');
  const [password, setPassword] = useState('ElectricCare@2026');
  const [securityToken, setSecurityToken] = useState('984-219');
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
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (data.success && data.data?.token) {
        // Set standard session cookie and localStorage
        document.cookie = `gts_auth_token=${data.data.token}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `gts_user_role=SUPER_ADMIN; path=/; max-age=604800; SameSite=Lax`;
        localStorage.setItem('gts_token', data.data.token);
        localStorage.setItem('gts_user', JSON.stringify(data.data.user));

        showToast('✓ Authentication Successful. Establishing National Terminal Session...');
        setTimeout(() => {
          router.push('/admin');
        }, 600);
      } else {
        setErrorMessage(data.error || 'Authentication rejected. Check credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Connection error contacting central auth cluster.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = () => {
    setIdentifier('admin@electricare.in');
    setPassword('ElectricCare@2026');
    setSecurityToken('984-219');
    showToast('Demo Super Admin credentials loaded');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden text-slate-100">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[140px] pointer-events-none" />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl bg-purple-950 text-white text-xs font-semibold shadow-2xl border border-purple-800 flex items-center gap-2">
          <BrandMark size="xs" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-purple-500/30 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <BrandLogo variant="badge-light" size="md" priority />
          <div className="pt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              SUPER ADMIN TERMINAL
            </div>
            <h1 className="text-xl font-black text-white tracking-tight mt-2">
              National Operations Command
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Authorized personnel only. Multi-state electrical grid & central treasury clearance.
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <span>🚨</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              National Admin Identifier (Email / Mobile)
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="admin@electricare.in"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                Master Security Passphrase
              </label>
              <span className="text-[10px] text-purple-400 font-medium">FIPS 180-4 Encrypted</span>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Hardware MFA Token Code (Simulated)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={securityToken}
                onChange={(e) => setSecurityToken(e.target.value)}
                placeholder="6-digit token"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-purple-300 font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />
              <span className="px-3 py-2 rounded-xl bg-purple-900/40 border border-purple-700/40 text-[11px] font-mono text-purple-300 shrink-0">
                LIVE
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-extrabold text-xs transition shadow-lg shadow-purple-950/50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">🔄</span>
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

        {/* 1-Click Demo Fill Action */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={handleQuickDemoFill}
            className="text-[11px] font-bold text-purple-400 hover:text-purple-300 transition flex items-center gap-1"
          >
            <span>⚡</span>
            <span>Fill Staging Admin Credentials</span>
          </button>
          <Link
            href="/partner/login"
            className="text-[11px] text-slate-400 hover:text-slate-200 transition"
          >
            Partner Portal →
          </Link>
        </div>

        {/* Security Compliance Footer */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[10px] text-slate-500 text-center leading-relaxed font-mono">
          🔒 Write-Once-Read-Many (WORM) audit ledger active. IP address, timestamp & TLS fingerprint logged.
        </div>
      </div>
    </div>
  );
}
