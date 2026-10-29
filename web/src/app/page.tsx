import Link from 'next/link';
import { BrandLogo } from '@/components/ui/brand-logo';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAF8FF] text-[#0F172A] flex flex-col items-center justify-center p-4 sm:p-6 md:p-10">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
        {/* Top Header Banner - Multi-Tenant Enterprise Header */}
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#4A148C] p-8 text-white relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="group transition-transform hover:scale-102">
                <BrandLogo variant="badge-light" size="lg" className="shadow-lg group-hover:shadow-xl transition-shadow" priority />
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                  GTS Ghar Tak Service
                  <span className="text-[11px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-purple-500/30 border border-purple-400/40 text-purple-200">
                    v2.4 Live
                  </span>
                </h1>
                <p className="text-xs text-purple-200 uppercase tracking-widest mt-1 font-medium">
                  National Operations Command • Central Fleet Administration • Super Admin Terminal
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Central Node Active</span>
              </span>
            </div>
          </div>
        </div>

        {/* Central Operations Architecture */}
        <div className="p-6 sm:p-8 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Enterprise Command Consoles
              </h2>
              <span className="text-[11px] font-mono text-slate-400">Section 65B & RBI Compliant</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary: Super Admin Command Console */}
              <Link
                href="/admin"
                className="group p-6 rounded-2xl border-2 border-purple-300 bg-gradient-to-b from-purple-50/70 to-white hover:border-[#4A148C] hover:shadow-2xl hover:shadow-purple-900/15 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-12 h-12 rounded-2xl bg-[#4A148C] text-white flex items-center justify-center text-2xl shadow-lg shadow-purple-900/30 group-hover:scale-105 transition-transform">
                      👑
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded bg-purple-100 text-[#4A148C] border border-purple-200">
                      National Command
                    </span>
                  </div>
                  <div className="text-lg font-black text-slate-900 group-hover:text-[#4A148C] transition-colors">
                    Super Admin Operations CRM
                  </div>
                  <div className="text-xs text-slate-600 mt-2 font-medium leading-relaxed">
                    Central telemetry, live dispatch radar, regional franchise ledgers, 1000V safety audits, commission interlocks & WORM compliance logs.
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-purple-100 flex items-center justify-between text-xs font-bold text-[#4A148C]">
                  <span>Launch Operations Terminal</span>
                  <span className="group-hover:translate-x-1.5 transition-transform">→</span>
                </div>
              </Link>

              {/* Secondary: Field Technician Fleet Telemetry */}
              <Link
                href="/admin/technicians"
                className="group p-6 rounded-2xl border-2 border-orange-200 bg-gradient-to-b from-orange-50/60 to-white hover:border-[#E65100] hover:shadow-2xl hover:shadow-orange-900/15 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-12 h-12 rounded-2xl bg-[#E65100] text-white flex items-center justify-center text-2xl shadow-lg shadow-orange-900/30 group-hover:scale-105 transition-transform">
                      🔧
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded bg-orange-100 text-[#E65100] border border-orange-200">
                      Fleet Operations
                    </span>
                  </div>
                  <div className="text-lg font-black text-slate-900 group-hover:text-[#E65100] transition-colors">
                    Technician Fleet & Dispatch
                  </div>
                  <div className="text-xs text-slate-600 mt-2 font-medium leading-relaxed">
                    Field technician mobile rosters, Aadhaar/PAN KYC verifications, dielectric safety kit certifications, and live GPS proximity tracking.
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-orange-100 flex items-center justify-between text-xs font-bold text-[#E65100]">
                  <span>View Technician Fleet</span>
                  <span className="group-hover:translate-x-1.5 transition-transform">→</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Core System Probes & Verification Hub */}
          <div className="border-t border-slate-200 pt-6">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
              Mission-Critical Operational Endpoints
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <Link
                href="/admin/dispatch"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-purple-600 hover:bg-purple-50/50 transition-all group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-[#4A148C]">Live Dispatch</div>
                  <div className="text-[10px] text-slate-500 font-mono">Radar & Telemetry</div>
                </div>
                <span className="text-slate-400 group-hover:text-[#4A148C]">→</span>
              </Link>

              <Link
                href="/admin/jobs"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-purple-600 hover:bg-purple-50/50 transition-all group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-[#4A148C]">Work Orders</div>
                  <div className="text-[10px] text-slate-500 font-mono">Full Lifecycle FSM</div>
                </div>
                <span className="text-slate-400 group-hover:text-[#4A148C]">→</span>
              </Link>

              <Link
                href="/admin/invoices"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-purple-600 hover:bg-purple-50/50 transition-all group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-[#4A148C]">Invoices & Finance</div>
                  <div className="text-[10px] text-slate-500 font-mono">GST & Ledger Audit</div>
                </div>
                <span className="text-slate-400 group-hover:text-[#4A148C]">→</span>
              </Link>

              <Link
                href="/admin/audit"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-purple-600 hover:bg-purple-50/50 transition-all group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-[#4A148C]">WORM Audit Trail</div>
                  <div className="text-[10px] text-slate-500 font-mono">FIPS 180-4 SHA-256</div>
                </div>
                <span className="text-slate-400 group-hover:text-[#4A148C]">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-8 py-3.5 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <BrandLogo variant="on-light" size="xs" />
            <span className="text-slate-400">|</span>
            <span>GTS Ghar Tak Service • National Operations SaaS</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">Authorized Personnel Only</span>
        </div>
      </div>
    </main>
  );
}
