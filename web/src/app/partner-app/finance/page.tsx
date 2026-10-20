'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  Building,
  CheckCircle2,
  Download,
  Check,
  Zap,
  ShieldCheck,
  Clock,
  AlertCircle,
} from '@/components/ui/icons';

interface WithdrawalItem {
  id: string;
  technicianId: string;
  technicianName: string;
  technicianBadge: string;
  technicianPhone: string;
  amountInr: number;
  payoutMethod: 'UPI' | 'BANK_ACCOUNT';
  upiId?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  status: 'PENDING' | 'PAID' | 'REJECTED';
  utrNumber?: string;
  partnerMessage?: string;
  rejectionReason?: string;
  requestedAt: string;
}

export default function PartnerAppFinancePage() {
  const router = useRouter();
  const [partnerBalance, setPartnerBalance] = useState(63000);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [utrSuccess, setUtrSuccess] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Technician Withdrawals state
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [isLoadingWithdrawals, setIsLoadingWithdrawals] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalItem | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [utrInput, setUtrInput] = useState('');
  const [partnerNoteInput, setPartnerNoteInput] = useState('');
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch('/api/finance/withdrawals');
      const json = await res.json();
      if (json.success && json.data?.withdrawals) {
        setWithdrawals(json.data.withdrawals);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingWithdrawals(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

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

  const handleProcessAction = async () => {
    if (!selectedWithdrawal || !actionType) return;
    setIsSubmittingAction(true);
    try {
      const body = actionType === 'APPROVE'
        ? {
            action: 'APPROVE',
            utrNumber: utrInput.trim() || `UTR${Date.now().toString().slice(-8)}`,
            message: partnerNoteInput.trim() || 'Payment successfully processed to account via IMPS/UPI.',
          }
        : {
            action: 'REJECT',
            rejectionReason: rejectionReasonInput.trim() || 'Bank account details mismatch. Please recheck and submit again.',
          };

      const res = await fetch(`/api/finance/withdrawals/${selectedWithdrawal.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          actionType === 'APPROVE'
            ? `✓ Payment of ₹${selectedWithdrawal.amountInr} approved with UTR ${data.data.utrNumber}`
            : `✗ Withdrawal request declined`
        );
        fetchWithdrawals();
        setSelectedWithdrawal(null);
        setActionType(null);
        setUtrInput('');
        setPartnerNoteInput('');
        setRejectionReasonInput('');
      } else {
        showToast(`Error: ${data.error || 'Failed to process'}`);
      }
    } catch {
      showToast('Network error while processing');
    } finally {
      setIsSubmittingAction(false);
    }
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
              <span className="text-emerald-700 font-semibold">Franchise Payout Console</span>
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

        {/* Technician Withdrawal Requests (Live Interactive Panel) */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                Technician Withdrawal Requests
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                {withdrawals.filter(w => w.status === 'PENDING').length} Pending
              </span>
            </div>
            <button
              onClick={fetchWithdrawals}
              className="text-[11px] font-bold text-blue-600 hover:underline"
            >
              Refresh
            </button>
          </div>

          {isLoadingWithdrawals ? (
            <div className="text-center py-6 text-xs text-slate-400">Loading requests...</div>
          ) : withdrawals.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500">
              No technician withdrawal requests submitted yet.
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border ${
                    item.status === 'PENDING'
                      ? 'border-amber-200 bg-amber-50/40'
                      : item.status === 'PAID'
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : 'border-red-200 bg-red-50/30'
                  } space-y-2.5 text-xs`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">
                        ₹{item.amountInr.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] text-slate-600 font-medium block">
                        {item.technicianName} ({item.technicianBadge}) • {item.technicianPhone}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : item.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Payment Destination Details */}
                  <div className="p-2.5 bg-white/80 rounded-lg border border-slate-200 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Payout Method:</span>
                      <span className="font-bold text-slate-800">
                        {item.payoutMethod === 'UPI' ? 'UPI Transfer' : 'Direct Bank NEFT/IMPS'}
                      </span>
                    </div>

                    {item.payoutMethod === 'UPI' ? (
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">UPI ID:</span>
                        <span className="font-mono font-bold text-blue-700">{item.upiId}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">Account Name:</span>
                          <span className="font-semibold text-slate-800">{item.accountHolderName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">A/C Number:</span>
                          <span className="font-mono font-bold text-slate-900">{item.accountNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">IFSC:</span>
                          <span className="font-mono font-bold text-purple-700">{item.ifscCode}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* UTR Confirmation / Decline Reason Display */}
                  {item.status === 'PAID' && (
                    <div className="p-2 bg-emerald-100/60 rounded-lg text-[11px] text-emerald-900 font-medium flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <div>
                          <strong>Settled with UTR:</strong> <span className="font-mono">{item.utrNumber}</span>
                        </div>
                        {item.partnerMessage && <div className="text-[10px] text-emerald-800 mt-0.5">{item.partnerMessage}</div>}
                      </div>
                    </div>
                  )}

                  {item.status === 'REJECTED' && (
                    <div className="p-2 bg-red-100/60 rounded-lg text-[11px] text-red-900 font-medium flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-red-700 shrink-0 mt-0.5" />
                      <div>
                        <strong>Declined:</strong> {item.rejectionReason}
                      </div>
                    </div>
                  )}

                  {/* Actions if Pending */}
                  {item.status === 'PENDING' && (
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedWithdrawal(item);
                          setActionType('APPROVE');
                          setUtrInput(`UPI/${Date.now().toString().slice(-8)}`);
                          setPartnerNoteInput(`Paid ₹${item.amountInr} via IMPS to ${item.technicianName}`);
                        }}
                        className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Pay & Enter UTR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedWithdrawal(item);
                          setActionType('REJECT');
                          setRejectionReasonInput('Bank account details mismatch. Please recheck your IFSC and Account Number.');
                        }}
                        className="px-3 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-bold text-[11px]"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Bank Account Settlement Card */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-900">Partner Settlement Destination</h3>
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
        </section>
      </div>

      {/* Partner Review Modal for Technician Withdrawal */}
      {selectedWithdrawal && actionType && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">
                {actionType === 'APPROVE' ? 'Approve & Confirm Payout' : 'Decline Withdrawal'}
              </h3>
              <button
                onClick={() => {
                  setSelectedWithdrawal(null);
                  setActionType(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Technician:</span>
                <span className="font-bold text-slate-900">{selectedWithdrawal.technicianName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount to Pay:</span>
                <span className="font-bold text-emerald-700 text-sm">₹{selectedWithdrawal.amountInr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Destination:</span>
                <span className="font-bold text-blue-700 font-mono">
                  {selectedWithdrawal.payoutMethod === 'UPI'
                    ? selectedWithdrawal.upiId
                    : `${selectedWithdrawal.accountNumber} (${selectedWithdrawal.ifscCode})`}
                </span>
              </div>
            </div>

            {actionType === 'APPROVE' ? (
              <div className="space-y-2 text-xs">
                <label className="block text-[11px] font-bold text-slate-700">
                  Bank UTR / Transaction Reference # *
                </label>
                <input
                  type="text"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  placeholder="e.g. 428910248102 or UPI/42891"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />

                <label className="block text-[11px] font-bold text-slate-700 pt-1">
                  Message / Confirmation to Technician
                </label>
                <textarea
                  value={partnerNoteInput}
                  onChange={(e) => setPartnerNoteInput(e.target.value)}
                  rows={2}
                  placeholder="Optional confirmation note..."
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <label className="block text-[11px] font-bold text-slate-700">
                  Decline Reason (shown to technician) *
                </label>
                <textarea
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  rows={3}
                  placeholder="State reason for rejecting request..."
                  className="w-full p-2 rounded-xl border border-red-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedWithdrawal(null);
                  setActionType(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSubmittingAction || (actionType === 'APPROVE' && !utrInput.trim())}
                onClick={handleProcessAction}
                className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs disabled:opacity-50 ${
                  actionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isSubmittingAction ? 'Processing...' : actionType === 'APPROVE' ? 'Confirm Payment' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settlement Confirmation Modal for Partner */}
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
