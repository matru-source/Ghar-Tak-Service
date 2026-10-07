'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  DollarSign,
  TrendingUp,
  Star,
  Check,
  Zap,
  Info,
  Clock,
  Award,
  Fan,
  Wrench,
  Download,
  Building,
} from '@/components/ui/icons';

type Timeframe = 'today' | 'week' | 'month';

interface EarningsData {
  gross: string;
  trend: string;
  totalJobs: number;
  slaRate: string;
  rating: number;
  incentive: string;
  bonusLabel: string;
  chartHeights: number[];
}

export default function TechEarningsPage() {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState<Timeframe>('month');

  // Wallet and withdrawal state
  const [walletBalance, setWalletBalance] = useState<number>(8450);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState<boolean>(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('8450');
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState<boolean>(false);
  const [withdrawSuccessUtr, setWithdrawSuccessUtr] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Timeframe configurations
  const timeframeData: Record<Timeframe, EarningsData> = {
    today: {
      gross: '₹1,000',
      trend: '+100% vs yesterday',
      totalJobs: 1,
      slaRate: '100% SLA',
      rating: 5.0,
      incentive: '+₹250',
      bonusLabel: 'Doorstep Rush',
      chartHeights: [20, 30, 10, 40, 15, 60, 35, 50, 80, 100],
    },
    week: {
      gross: '₹8,450',
      trend: '+22.8% vs last week',
      totalJobs: 9,
      slaRate: '100% SLA',
      rating: 4.9,
      incentive: '+₹800',
      bonusLabel: 'Weekend Sprint',
      chartHeights: [40, 55, 30, 70, 45, 80, 65, 85, 90, 95],
    },
    month: {
      gross: '₹32,500',
      trend: '+15.4% vs last mo.',
      totalJobs: 34,
      slaRate: '100% SLA',
      rating: 4.85,
      incentive: '+₹2,400',
      bonusLabel: 'Monsoon Bonus',
      chartHeights: [40, 65, 50, 85, 60, 75, 100, 70, 90, 95],
    },
  };

  const currentData = timeframeData[timeframe];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(withdrawAmount);
    if (!amountNum || amountNum <= 0 || amountNum > walletBalance) {
      showToast('Please enter a valid amount within available balance');
      return;
    }

    setIsProcessingWithdraw(true);
    setTimeout(() => {
      const generatedUtr = `IMPS${Date.now().toString().slice(-8)}`;
      setWalletBalance((prev) => Math.max(0, prev - amountNum));
      setIsProcessingWithdraw(false);
      setWithdrawSuccessUtr(generatedUtr);
      showToast(`₹${amountNum.toLocaleString('en-IN')} transferred via IMPS!`);
    }, 1200);
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 text-slate-900 pb-28 relative select-none">
      {/* Toast Alert */}
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
            onClick={() => router.push('/tech')}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors shrink-0"
            aria-label="Back to Queue"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="font-bold text-sm sm:text-base text-slate-900 truncate">
              Technician Earnings Ledger
            </h1>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <span>TECH-SCR-05</span>
              <span>•</span>
              <span className="text-orange-600 font-semibold">Wallet & Payout Batches</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 text-[11px] font-bold border border-orange-200/60">
            PRO L3
          </div>
          <div className="w-8 h-8 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            RK
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="px-4 pt-3.5 space-y-3.5">
        {/* Status & Motivational Header Toast */}
        <section className="bg-slate-100/80 rounded-2xl p-3 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1">
                <span>Rajesh Kumar</span>
                <span className="text-slate-400 font-normal">• ID #TK-8491</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                Daily Safety Target 100% Achieved
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider">
            Verified
          </span>
        </section>

        {/* 1. Earnings Overview Card */}
        <section className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
          {/* Timeframe Toggle Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setTimeframe('today')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                timeframe === 'today'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('week')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                timeframe === 'week'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('month')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                timeframe === 'month'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
          </div>

          {/* Main Balance Display */}
          <div className="mt-3.5 flex flex-col">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              Gross Earnings Period
              <Info className="w-3.5 h-3.5 text-slate-400" />
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span id="earnings-val" className="text-3xl font-black text-slate-900 tracking-tight">
                {currentData.gross}
              </span>
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                {currentData.trend}
              </span>
            </div>
          </div>

          {/* Micro Sparkline / Visual Trend Representation */}
          <div className="mt-3 py-2 bg-slate-50 rounded-xl px-3 border border-slate-100">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-500">Daily Earnings Surge (Aug)</span>
              <span className="text-emerald-700 font-bold">Peak ₹2,850/day</span>
            </div>
            <div className="w-full h-8 flex items-end gap-1.5 pt-1">
              {currentData.chartHeights.map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className={`flex-1 rounded-t-xs transition-all duration-300 ${
                    i === currentData.chartHeights.length - 1
                      ? 'bg-orange-600'
                      : i === 6
                      ? 'bg-blue-600'
                      : 'bg-orange-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Sub-metrics Grid */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-100">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
              <span className="text-[10px] text-slate-500 block">Total Jobs</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-extrabold text-slate-900">{currentData.totalJobs}</span>
                <span className="text-[10px] text-slate-500">done</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold mt-0.5 flex items-center gap-0.5">
                <Check className="w-2.5 h-2.5 stroke-[3]" /> {currentData.slaRate}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
              <span className="text-[10px] text-slate-500 block">Rating</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-base font-extrabold text-slate-900">{currentData.rating}</span>
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              </div>
              <span className="text-[10px] text-orange-700 font-bold mt-0.5 block">
                Top 5% Tier
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
              <span className="text-[10px] text-slate-500 block">Incentive</span>
              <div className="flex items-baseline mt-0.5">
                <span className="text-base font-extrabold text-emerald-700">{currentData.incentive}</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block truncate">
                {currentData.bonusLabel}
              </span>
            </div>
          </div>
        </section>

        {/* 2. Wallet & Payout Action Card */}
        <section className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Available Wallet Cash
              </span>
              <div className="mt-0.5 text-2xl font-black text-slate-900 tracking-tight">
                ₹{walletBalance.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          {/* Linked Bank KYC Badge Area */}
          <div className="mt-3 p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200/70">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 block">HDFC Bank •••• 4921</span>
                <span className="text-[10px] text-slate-500 block">Primary Salary Account</span>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>KYC Active</span>
            </div>
          </div>

          {/* Action Button & Instant Payout Notice */}
          <div className="mt-3.5 space-y-1.5">
            <button
              id="withdraw-btn"
              type="button"
              onClick={() => {
                setWithdrawSuccessUtr(null);
                setWithdrawAmount(String(walletBalance));
                setIsWithdrawModalOpen(true);
              }}
              className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
            >
              <Wallet className="w-4 h-4" />
              <span>Withdraw to Bank Account</span>
            </button>
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
              <Zap className="w-3.5 h-3.5 text-orange-600" />
              <span>Instant IMPS payout within 15 minutes • 24x7</span>
            </div>
          </div>
        </section>

        {/* 3. Performance & Safety Bonus Tier */}
        <section className="bg-blue-50/70 rounded-2xl p-4 border border-blue-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-slate-900 block">
                  Level 3 Master Electrician
                </span>
                <span className="text-xs text-slate-600 block">
                  Commission Perk: <strong className="text-blue-700">+5% Extra per Job</strong>
                </span>
              </div>
            </div>
            <span className="text-blue-700 font-bold text-xs">85%</span>
          </div>

          {/* Tier Progress Meter */}
          <div className="mt-3 pt-1 relative z-10">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span>Tier Progress (34 of 40 monthly jobs)</span>
              <span className="font-bold text-blue-700">6 jobs left</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white border border-blue-200 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '85%' }}></div>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1.5 leading-snug">
              Complete 6 more verified jobs before 31 Aug to qualify for ₹3,000 Milestone Bonus.
            </span>
          </div>

          {/* Safety Checkpoint Guarantee Block */}
          <div className="mt-3 p-2.5 bg-white rounded-xl flex items-center justify-between border border-blue-100 shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 block">100% Safety Compliance</span>
                <span className="text-[10px] text-slate-500 block">34/34 Safety Checklists fully approved</span>
              </div>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
              Clean Record
            </span>
          </div>
        </section>

        {/* 4. Recent Job Earnings Transaction Ledger */}
        <section className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-sm text-slate-900">Earnings Activity</h2>
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                August 2026
              </span>
            </div>
            <button
              type="button"
              onClick={() => showToast('📥 Statement for August 2026 downloaded (PDF)')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Statement</span>
            </button>
          </div>

          {/* Transaction Items */}
          <div className="space-y-2 pt-1">
            {/* Item 1: Ceiling Fan Installation (J-1001) */}
            <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Fan className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900 truncate">Ceiling Fan Installation</span>
                    <span className="text-[10px] text-slate-500 font-mono">#J-1001</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block truncate">
                    Today, 11:35 AM • Flat 402 Colaba Sea Green
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0 pl-2">
                <span className="font-bold text-sm text-emerald-700">+₹1,000</span>
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Credited
                </span>
              </div>
            </div>

            {/* Item 2: MCB Short-Circuit Repair (J-0998) */}
            <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900 truncate">MCB Short-Circuit Diagnostic</span>
                    <span className="text-[10px] text-slate-500 font-mono">#J-0998</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block truncate">
                    Yesterday, 4:10 PM • Fort Market Lane
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0 pl-2">
                <span className="font-bold text-sm text-emerald-700">+₹500</span>
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Credited
                </span>
              </div>
            </div>

            {/* Item 3: 3-Phase DB Board Wiring (J-0995) */}
            <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Wrench className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900 truncate">3-Phase Commercial Board</span>
                    <span className="text-[10px] text-slate-500 font-mono">#J-0995</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block truncate">
                    25 Aug, 2:30 PM • Nariman Point Tower
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0 pl-2">
                <span className="font-bold text-sm text-emerald-700">+₹1,800</span>
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Credited
                </span>
              </div>
            </div>

            {/* Item 4: Bank Payout Transfer */}
            <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-100/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900 truncate">Weekly Auto Payout</span>
                    <span className="text-[10px] text-slate-500 font-mono">IMPS</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block truncate">
                    24 Aug, 8:00 AM • HDFC ****4921
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0 pl-2">
                <span className="font-bold text-sm text-slate-900">-₹24,050</span>
                <span className="text-[10px] text-blue-700 font-semibold flex items-center gap-0.5">
                  <Check className="w-3 h-3 stroke-[3]" /> Settled
                </span>
              </div>
            </div>
          </div>

          {/* Compliance & TDS Reassurance Note */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>GST Compliant & Auto TDS Deducted (1%)</span>
            </div>
            <button
              type="button"
              onClick={() => showToast('📄 Form 16A TDS Certificate ready for download')}
              className="font-bold text-blue-700 hover:text-blue-800 transition-colors"
            >
              TDS Certificate
            </button>
          </div>
        </section>
      </div>

      {/* Bottom Sticky Tab Navigation for Technician Mobile Suite */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-2">
          <Link
            href="/tech"
            className="flex flex-col items-center gap-0.5 py-1 text-slate-500 hover:text-slate-900 text-[10px] font-semibold transition-colors"
          >
            <Zap className="w-5 h-5 text-slate-400" />
            <span>Active Queue</span>
          </Link>
          <Link
            href="/tech/job"
            className="flex flex-col items-center gap-0.5 py-1 text-slate-500 hover:text-slate-900 text-[10px] font-semibold transition-colors"
          >
            <Clock className="w-5 h-5 text-slate-400" />
            <span>Current Job</span>
          </Link>
          <Link
            href="/tech/earnings"
            className="flex flex-col items-center gap-0.5 py-1 text-orange-600 text-[10px] font-bold"
          >
            <Wallet className="w-5 h-5 text-orange-600" />
            <span>Earnings</span>
          </Link>
        </div>
      </nav>

      {/* Withdrawal Modal Dialog */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Withdraw to Bank</h3>
                  <span className="text-[10px] text-slate-500">Instant 24x7 IMPS Transfer</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {withdrawSuccessUtr ? (
              <div className="py-3 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-slate-900">Transfer Successful!</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Funds will reflect in HDFC account within 10 minutes.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 text-left">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount:</span>
                    <span className="font-bold text-slate-900">₹{Number(withdrawAmount).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bank:</span>
                    <span className="font-bold text-slate-900">HDFC Bank (•••• 4921)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">UTR / Ref:</span>
                    <span className="font-bold text-emerald-700 font-mono">{withdrawSuccessUtr}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-orange-600 text-white font-bold text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleWithdrawSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Enter Withdrawal Amount (INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      max={walletBalance}
                      min={100}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 font-black text-xl text-slate-900 focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                    <span>Available: ₹{walletBalance.toLocaleString('en-IN')}</span>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(String(walletBalance))}
                      className="text-orange-600 font-bold hover:underline"
                    >
                      Withdraw All
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-1">
                  <div className="font-semibold text-blue-900 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-700" />
                    <span>Destination Account</span>
                  </div>
                  <p className="text-[11px] text-blue-800">
                    HDFC Bank • A/C #02381040004921 • IFSC HDFC0000238
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isProcessingWithdraw || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > walletBalance}
                  className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
                >
                  {isProcessingWithdraw ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Processing Bank Transfer...</span>
                    </>
                  ) : (
                    <span>Confirm & Withdraw ₹{Number(withdrawAmount || 0).toLocaleString('en-IN')}</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
