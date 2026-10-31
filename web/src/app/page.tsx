import Link from 'next/link';
import { BrandLogo } from '@/components/ui/brand-logo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 md:p-10 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-900/20 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-2xl w-full bg-slate-900/90 rounded-3xl shadow-2xl border border-slate-800 backdrop-blur-xl relative z-10 overflow-hidden">
        {/* Header */}
        <div className="p-8 sm:p-10 flex flex-col items-center text-center space-y-4 border-b border-slate-800/80">
          <BrandLogo variant="badge-light" size="lg" priority />
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              National Operations Command
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-3">
              GTS Ghar Tak Service
            </h1>
            <p className="text-slate-400 text-sm mt-2 max-w-md leading-relaxed font-medium">
              Central Enterprise Portal for Multi-State Service Dispatch, Regional Franchise Management, and Financial Governance.
            </p>
          </div>
        </div>

        {/* Action Panel */}
        <div className="p-8 sm:p-10 space-y-4">
          {/* Card 1: Super Admin Terminal */}
          <Link
            href="/admin/login"
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-extrabold text-sm transition shadow-xl shadow-purple-950/60 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">👑</span>
              <div className="text-left">
                <div className="font-black text-white text-base">Super Admin Terminal</div>
                <div className="text-[11px] text-purple-200 font-normal">National Telemetry, Central Ledgers & WORM Audit Trail</div>
              </div>
            </div>
            <span className="text-lg group-hover:translate-x-1.5 transition-transform">→</span>
          </Link>

          {/* Card 2: Regional Franchise Partner Portal */}
          <Link
            href="/partner"
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-900/60 to-emerald-950/60 hover:from-emerald-800/70 hover:to-emerald-900/70 border border-emerald-500/30 text-slate-100 font-bold text-xs transition shadow-lg shadow-emerald-950/40 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏢</span>
              <div className="text-left">
                <div className="font-black text-emerald-300 text-base">Franchise Partner Portal</div>
                <div className="text-[11px] text-emerald-200/80 font-normal">State Hub Operations, Live Dispatch Console & 15% Rev Share</div>
              </div>
            </div>
            <span className="text-emerald-400 text-lg group-hover:translate-x-1.5 transition-transform">→</span>
          </Link>

          {/* Card 3: Client UAT & Handover Portal */}
          <Link
            href="/uat"
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-900/50 to-indigo-950/50 hover:from-blue-800/60 hover:to-indigo-900/60 border border-blue-500/30 text-slate-100 font-bold text-xs transition shadow-lg shadow-blue-950/40 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div className="text-left">
                <div className="font-black text-blue-300 text-sm">Client UAT &amp; Handover Portal</div>
                <div className="text-[11px] text-blue-200/80 font-normal">All 60 Screens, 1-Click Role Switcher &amp; WORM Sign-Off Seal</div>
              </div>
            </div>
            <span className="text-blue-400 text-lg group-hover:translate-x-1.5 transition-transform">→</span>
          </Link>
        </div>

        {/* Footer */}
        <div className="bg-slate-950/70 px-8 py-4 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2 border-t border-slate-800/80">
          <span>© 2026 GTS Ghar Tak Service. All Rights Reserved.</span>
          <span className="font-mono text-[11px] text-slate-400">Enterprise Security Active</span>
        </div>
      </div>
    </main>
  );
}
