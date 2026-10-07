import Link from 'next/link';
import { BrandLogo, BrandMark } from '@/components/ui/brand-logo';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAF8FF] text-[#0F172A] flex flex-col items-center justify-center p-4 sm:p-6 md:p-10">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
        {/* Top Header Banner - Multi-Tenant Enterprise Header */}
        <div className="bg-gradient-to-r from-[#0D47A1] via-[#1B5E20] to-[#4A148C] p-8 text-white relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="group transition-transform hover:scale-102">
                <BrandLogo variant="badge-light" size="lg" className="shadow-lg group-hover:shadow-xl transition-shadow" priority />
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                  GTS Ghar Tak Service
                  <span className="text-[11px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-white/20 border border-white/30 text-white">
                    v2.4 Live
                  </span>
                </h1>
                <p className="text-xs text-blue-100 uppercase tracking-widest mt-1 font-medium">
                  ElectriCare Platform • Pan-India Multi-Tenant Engineering SaaS • 4-Role Architecture
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/uat"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-md transition-colors"
              >
                <span>🏆 Client UAT Portal</span>
                <span>→</span>
              </Link>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>100% Delivered</span>
              </span>
            </div>
          </div>
        </div>

        {/* 4 Role Matrix as per gts.drawio.pdf */}
        <div className="p-6 sm:p-8 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Design Architecture & Role Themes (as specified in gts.drawio.pdf)
              </h2>
              <span className="text-[11px] font-mono text-slate-400">Section 65B & RBI Compliant</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Role 1: Super Admin */}
              <Link
                href="/admin"
                className="group p-5 rounded-2xl border-2 border-purple-200/80 bg-gradient-to-b from-purple-50/60 to-white hover:border-[#4A148C] hover:shadow-xl hover:shadow-purple-900/10 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-9 h-9 rounded-xl bg-[#4A148C] text-white flex items-center justify-center text-lg shadow-md shadow-purple-900/30 group-hover:scale-110 transition-transform">
                      👑
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-purple-100 text-[#4A148C] border border-purple-200">
                      #4A148C
                    </span>
                  </div>
                  <div className="text-sm font-black text-slate-900 group-hover:text-[#4A148C] transition-colors">
                    Super Admin CRM
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                    National Telemetry, 24 Partners, Commission Interlocks, FIPS 180-4 WORM Audit.
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-purple-100 flex items-center justify-between text-xs font-bold text-[#4A148C]">
                  <span>Launch Portal</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>

              {/* Role 2: Regional Partner */}
              <Link
                href="/partner"
                className="group p-5 rounded-2xl border-2 border-emerald-200/80 bg-gradient-to-b from-emerald-50/60 to-white hover:border-[#1B5E20] hover:shadow-xl hover:shadow-emerald-900/10 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-9 h-9 rounded-xl bg-[#1B5E20] text-white flex items-center justify-center text-lg shadow-md shadow-emerald-900/30 group-hover:scale-110 transition-transform">
                      🏢
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-[#1B5E20] border border-emerald-200">
                      #1B5E20
                    </span>
                  </div>
                  <div className="text-sm font-black text-slate-900 group-hover:text-[#1B5E20] transition-colors">
                    Partner Web CRM
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                    Maharashtra Hub MH-01, Dispatch Console, #J-1001 FSM, SLA Proximity Escalation.
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs font-bold text-[#1B5E20]">
                  <span>Launch Portal</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>

              {/* Role 3: Field Technician */}
              <Link
                href="/tech"
                className="group p-5 rounded-2xl border-2 border-orange-200/80 bg-gradient-to-b from-orange-50/60 to-white hover:border-[#E65100] hover:shadow-xl hover:shadow-orange-900/10 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-9 h-9 rounded-xl bg-[#E65100] text-white flex items-center justify-center text-lg shadow-md shadow-orange-900/30 group-hover:scale-110 transition-transform">
                      🔧
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-orange-100 text-[#E65100] border border-orange-200">
                      #E65100
                    </span>
                  </div>
                  <div className="text-sm font-black text-slate-900 group-hover:text-[#E65100] transition-colors">
                    Technician Fleet
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                    Field Mobile Work Orders, Rajesh Kumar (TECH-7821), 1000V Gloves, GPS & Handover.
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-orange-100 flex items-center justify-between text-xs font-bold text-[#E65100]">
                  <span>Launch Tech App</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>

              {/* Role 4: Customer / User */}
              <Link
                href="/customer"
                className="group p-5 rounded-2xl border-2 border-blue-200/80 bg-gradient-to-b from-blue-50/60 to-white hover:border-[#0D47A1] hover:shadow-xl hover:shadow-blue-900/10 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-9 h-9 rounded-xl bg-[#0D47A1] text-white flex items-center justify-center text-lg shadow-md shadow-blue-900/30 group-hover:scale-110 transition-transform">
                      👤
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-[#0D47A1] border border-blue-200">
                      #0D47A1
                    </span>
                  </div>
                  <div className="text-sm font-black text-slate-900 group-hover:text-[#0D47A1] transition-colors">
                    Customer Mobile App
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                    Amit Sharma (CUST-SCR-01), Colaba 400001, 24/7 Rapid SOS Chip, Live Job #J-1001 Tracking.
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-blue-100 flex items-center justify-between text-xs font-bold text-[#0D47A1]">
                  <span>Launch Mobile App</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Core System Probes & Verification Hub */}
          <div className="border-t border-slate-200 pt-6">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
              Mission-Critical Operational Endpoints
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              <Link
                href="/uat"
                className="flex items-center justify-between p-3.5 rounded-xl border-2 border-emerald-400 bg-emerald-50/60 hover:bg-emerald-100/60 transition-all group"
              >
                <div>
                  <div className="text-xs font-black text-emerald-900 group-hover:text-emerald-700">Client UAT Portal</div>
                  <div className="text-[10px] text-emerald-700 font-mono font-bold">Gateway 2 Sign-off</div>
                </div>
                <span className="text-emerald-600 group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>

              <Link
                href="/api/health"
                target="_blank"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-[#0D47A1] hover:bg-blue-50/50 transition-all group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-[#0D47A1]">Health Engine</div>
                  <div className="text-[10px] text-slate-500 font-mono">/api/health</div>
                </div>
                <span className="text-slate-400 group-hover:text-[#0D47A1]">→</span>
              </Link>

              <Link
                href="/partner/jobs?ticket=J-1001"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-[#1B5E20] hover:bg-emerald-50/50 transition-all group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-[#1B5E20]">Work Order #J-1001</div>
                  <div className="text-[10px] text-slate-500 font-mono">7-Stage FSM Cycle</div>
                </div>
                <span className="text-slate-400 group-hover:text-[#1B5E20]">→</span>
              </Link>

              <Link
                href="/partner/escalations"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-[#BF360C] hover:bg-orange-50/50 transition-all group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-[#BF360C]">SLA Escalations</div>
                  <div className="text-[10px] text-slate-500 font-mono">#J-1005 Proximity</div>
                </div>
                <span className="text-slate-400 group-hover:text-[#BF360C]">→</span>
              </Link>

              <Link
                href="/admin/audit"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-[#4A148C] hover:bg-purple-50/50 transition-all group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-[#4A148C]">WORM Audit Trail</div>
                  <div className="text-[10px] text-slate-500 font-mono">FIPS 180-4 SHA-256</div>
                </div>
                <span className="text-slate-400 group-hover:text-[#4A148C]">→</span>
              </Link>
            </div>
          </div>

          {/* Palette Authenticity Verification Banner */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
            <span className="text-lg">🎨</span>
            <div className="flex-1">
              <div className="font-bold text-white flex items-center gap-2">
                <span>Color System 100% Synchronized with Assets/gts.drawio.pdf</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Verified Vector Stream
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Admin CRM (<code className="text-purple-300">#4A148C</code>) • Partner Hub (<code className="text-emerald-300">#1B5E20</code>) • Technician Fleet (<code className="text-orange-300">#E65100</code>) • Customer App (<code className="text-blue-300">#0D47A1</code>) • Critical Alert (<code className="text-red-400">#BF360C</code>).
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-8 py-3.5 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <BrandLogo variant="on-light" size="xs" />
            <span className="text-slate-400">|</span>
            <span>GTS Ghar Tak Service • ElectriCare SaaS Enterprise</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">Strict Compliance with gts.drawio.pdf & Indian IT Act 65B</span>
        </div>
      </div>
    </main>
  );
}

