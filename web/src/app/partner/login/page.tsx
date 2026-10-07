'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BrandLogo, BrandMark } from '@/components/ui/brand-logo';

const FRANCHISE_HUBS = [
  { id: 'MH-01', name: 'Maharashtra Regional Hub (MH-01)', state: 'Maharashtra', gstin: '27AABCU9603R1ZM' },
  { id: 'KA-01', name: 'Karnataka Regional Hub (KA-01)', state: 'Karnataka', gstin: '29AABCU9603R1ZL' },
  { id: 'DL-01', name: 'Delhi NCR Regional Hub (DL-01)', state: 'Delhi NCR', gstin: '07AABCU9603R1ZK' },
];

export default function RegionalPartnerLoginPage() {
  const router = useRouter();
  const [selectedHub, setSelectedHub] = useState('MH-01');
  const [identifier, setIdentifier] = useState('maharashtra.ops@electricare.in');
  const [password, setPassword] = useState('ElectricCare@2026');
  const [licenseCode, setLicenseCode] = useState('LIC-MH-2026-991');
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
        document.cookie = `gts_auth_token=${data.data.token}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `gts_user_role=PARTNER; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `gts_partner_hub=${selectedHub}; path=/; max-age=604800; SameSite=Lax`;
        localStorage.setItem('gts_token', data.data.token);
        localStorage.setItem('gts_user', JSON.stringify(data.data.user));
        localStorage.setItem('gts_hub', selectedHub);

        showToast('✓ Franchise Verified. Launching Regional Dispatch Console...');
        setTimeout(() => {
          router.push('/partner');
        }, 600);
      } else {
        setErrorMessage(data.error || 'Partner franchise verification failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Connection error connecting to franchise ledger.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = () => {
    setSelectedHub('MH-01');
    setIdentifier('maharashtra.ops@electricare.in');
    setPassword('ElectricCare@2026');
    setLicenseCode('LIC-MH-2026-991');
    showToast('Loaded Maharashtra Hub demo credentials');
  };

  const currentHubInfo = FRANCHISE_HUBS.find((h) => h.id === selectedHub) || FRANCHISE_HUBS[0];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden text-slate-100">
      {/* Background Emerald Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-900/25 rounded-full blur-[140px] pointer-events-none" />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl bg-emerald-950 text-white text-xs font-semibold shadow-2xl border border-emerald-800 flex items-center gap-2">
          <BrandMark size="xs" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <BrandLogo variant="badge-light" size="md" priority />
          <div className="pt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              FRANCHISE PARTNER PORTAL
            </div>
            <h1 className="text-xl font-black text-white tracking-tight mt-2">
              Regional Operations Hub
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              State franchise territory fleet management, 30-min SLA dispatch & 15% revenue share.
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
              Assigned Franchise Territory Hub
            </label>
            <select
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
            <div className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center justify-between">
              <span>GSTIN: {currentHubInfo.gstin}</span>
              <span>15% Partner Share Active</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Hub Manager Email / Phone
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="maharashtra.ops@electricare.in"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                Partner Password
              </label>
              <span className="text-[10px] text-emerald-400 font-medium">State Licensed</span>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Franchise License Serial (Simulated)
            </label>
            <input
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
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-xs transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">🔄</span>
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

        {/* 1-Click Demo Fill Action */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={handleQuickDemoFill}
            className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1"
          >
            <span>⚡</span>
            <span>Fill Demo Maharashtra Hub</span>
          </button>
          <Link
            href="/admin/login"
            className="text-[11px] text-slate-400 hover:text-slate-200 transition"
          >
            Admin Terminal →
          </Link>
        </div>

        {/* Territory Compliance Footer */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[10px] text-slate-500 text-center leading-relaxed font-mono">
          🏢 Multi-Tenant Territory Scoped. Access restricted to allocated state pincodes & licensed fleet.
        </div>
      </div>
    </div>
  );
}
