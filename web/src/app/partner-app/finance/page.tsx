'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Wallet,
  DollarSign,
  TrendingUp,
  Building,
  CheckCircle2,
  Download,
  Check,
  Zap,
  ShieldCheck,
  Clock,
} from '@/components/ui/icons';

export default function PartnerAppFinancePage() {
  const router = useRouter();
  const [partnerBalance, setPartnerBalance] = useState(63000);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [utrSuccess, setUtrSuccess] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleInstantSettlement = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const utr = `NEFT${Date.now().toString().slice(-8)}`;
      setPartnerBalance(0);
      setIsProcessing(false);
      setUtrSuccess(utr);
      showToast('✓ ₹63,000 settled to Axis Bank account!');
    }, 1200);
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 text-slate-900 pb-20 select-none relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => router.push('/partner-app')}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors shrink-0"
            aria-label="Back to Overview"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="font-bold text-sm sm:text-base text-slate-900 truncate">
              Regional Finance & Payouts
            </h1>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <span>PTNR-APP-04</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">Maharashtra Franchise Settlement</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => showToast('📥 Weekly Franchise Financial Statement downloaded (CSV)')}
          className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          aria-label="Download Statement"
        >
          <Download className="w-4 h-4" />
        </button>
      </header>

      {/* Main Container */}
      <div className="px-4 pt-3.5 space-y-3.5">
        {/* Partner Commission Overview Card */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Accrued Franchise Share (15%)
              </span>
              <div className="text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                ₹{partnerBalance.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
            <TrendingUp className="w-4 h-4" />
            <span>+18.2% vs previous settlement cycle</span>
          </div>

          {/* 3-Way Commission Split Breakdown */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Gross Field Volume (Week 4):</span>
              <span className="font-bold text-slate-900">₹4,20,000</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Partner Royalty (15%):</span>
              <span>+₹63,000</span>
            </div>
            <div className="flex justify-between text-blue-700">
              <span>Technician Pool (70%):</span>
              <span>₹2,94,000 (Disbursed)</span>
            </div>
            <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200">
              <span>Platform Fee & GST Escrow (15%):</span>
              <span>₹63,000</span>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            disabled={partnerBalance === 0}
            onClick={() => {
              setUtrSuccess(null);
              setIsSettlementModalOpen(true);
            }}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Building className="w-4 h-4" />
            <span>Request Instant Settlement</span>
          </button>
        </section>

        {/* Bank Account Settlement Card */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-900">Settlement Destination</h3>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              Active
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-xs text-slate-900 block truncate">
                Axis Bank Corporate A/c
              </span>
              <span className="text-[11px] text-slate-500 block">
                A/C #918020048192012 • IFSC UTIB0000123
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Automated bank settlement triggers every Monday at 08:00 AM IST.</span>
          </p>
        </section>

        {/* Recent Financial Batches */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-bold text-xs text-slate-900">Recent Ledger Batches</h3>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Tech Fleet Payout Batch #38</span>
                <span className="text-[10px] text-slate-500">34 Technicians • Completed</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-900 block">₹2,94,000</span>
                <span className="text-[10px] text-emerald-700 font-semibold">Disbursed</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Franchise Share Week 3</span>
                <span className="text-[10px] text-slate-500">Transferred to Axis Bank</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-900 block">₹58,400</span>
                <span className="text-[10px] text-blue-700 font-semibold">Settled</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">GST 18% Statutory Reserve</span>
                <span className="text-[10px] text-slate-500">Government Escrow Portal</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-900 block">₹37,800</span>
                <span className="text-[10px] text-purple-700 font-semibold">Deposited</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Settlement Confirmation Modal */}
      {isSettlementModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-3.5 text-center">
            {utrSuccess ? (
              <div className="space-y-3 py-2">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-slate-900">Settlement Dispatched!</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ₹63,000 transferred via NEFT/RTGS to Axis Bank account.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 text-left">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reference:</span>
                    <span className="font-mono font-bold text-slate-800">{utrSuccess}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-bold text-emerald-700">Bank Settlement Active</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSettlementModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Confirm Settlement</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Transfer accrued franchise royalty ₹63,000 to primary corporate account?
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Beneficiary:</span>
                    <span className="font-bold text-slate-800">Maharashtra Electrical Infra LLP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bank:</span>
                    <span className="font-bold text-slate-800">Axis Bank (IFSC UTIB0000123)</span>
                  </div>
                </div>
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleInstantSettlement}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs"
                  >
                    {isProcessing ? 'Processing Bank Settlement...' : 'Yes, Disburse ₹63,000'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSettlementModalOpen(false)}
                    className="w-full py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
