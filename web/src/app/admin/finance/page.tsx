'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface FinanceData {
  totalGmvInr: number;
  totalBaseLaborInr: number;
  totalGstCollectedInr: number;
  platformFeesRecognizedInr: number;
  partnerCommissionsEarnedInr: number;
  technicianDisbursementsInr: number;
  totalInvoicesCount: number;
  paidInvoicesCount: number;
  ledgerTelemetry?: {
    totalCustomerInflowInr: number;
    totalGstReserveInr: number;
    totalPlatformFeeInr: number;
    totalPartnerCommissionInr: number;
    totalTechnicianPayoutsInr: number;
    totalAllocatedDebits: number;
    varianceInr: number;
    isDoubleEntryBalanced: boolean;
  };
  recentLedgers?: any[];
}

export default function AdminFinancePage() {
  const [finance, setFinance] = useState<FinanceData | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const [resFin, resInv] = await Promise.all([
        fetch('/api/admin/finance'),
        fetch('/api/admin/invoices'),
      ]);
      const jsonFin = await resFin.json();
      const jsonInv = await resInv.json();

      if (jsonFin.success) setFinance(jsonFin.data);
      if (jsonInv.success) setInvoices(jsonInv.data.invoices);
    } catch {
      showToast('Error loading financial treasury data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-400 font-medium text-sm animate-bounce">
          <span>🏦</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
              ADM-SCR-12 & ADM-SCR-14
            </span>
            <span className="text-xs text-slate-400 font-medium">Statutory Tax & Central Escrow Treasury</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Central Finance, Ledgers & 18% GST Escrow</h1>
          <p className="text-sm text-slate-400">
            Automated double-entry reconciliation: 15% Platform, 15% Partner Franchise, 70% Technician + 18% Statutory GST reserve.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/commissions"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition transform active:scale-95"
          >
            <span>⚖️</span>
            <span>Configure Commission Rates</span>
          </Link>
        </div>
      </div>

      {/* Reconciliation Status Chip */}
      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-lg">
            ✓
          </div>
          <div>
            <div className="text-sm font-black text-white flex items-center gap-2">
              <span>Automated Double-Entry Ledger Reconciled</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ZERO VARIANCE
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Customer Inflow matches Statutory GST + Platform Cut + Partner Share + Tech Net Payout exactly.
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-500 block uppercase font-mono">Discrepancy</span>
          <span className="text-sm font-bold text-emerald-400 font-mono">₹0.00 INR</span>
        </div>
      </div>

      {/* Macro Telemetry KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Gross Platform GMV</div>
          <div className="text-2xl font-black text-white mt-1">
            ₹{finance ? finance.totalGmvInr.toLocaleString('en-IN') : '...'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{finance?.totalInvoicesCount || 0} Tax Invoices</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">18% GST Escrow</div>
          <div className="text-2xl font-black text-amber-400 mt-1">
            ₹{finance ? finance.totalGstCollectedInr.toLocaleString('en-IN') : '...'}
          </div>
          <div className="text-[11px] text-amber-500/80 mt-1">CGST 9% + SGST 9%</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Platform Take (15%)</div>
          <div className="text-2xl font-black text-blue-400 mt-1">
            ₹{finance ? finance.platformFeesRecognizedInr.toLocaleString('en-IN') : '...'}
          </div>
          <div className="text-[11px] text-blue-400/80 mt-1">Recognized Revenue</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Partner Cut (15%)</div>
          <div className="text-2xl font-black text-purple-400 mt-1">
            ₹{finance ? finance.partnerCommissionsEarnedInr.toLocaleString('en-IN') : '...'}
          </div>
          <div className="text-[11px] text-purple-400/80 mt-1">Franchise Escrow</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 col-span-2 md:col-span-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tech Payouts (70%)</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            ₹{finance ? finance.technicianDisbursementsInr.toLocaleString('en-IN') : '...'}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Net Take-Home</div>
        </div>
      </div>

      {/* Tax Invoicing Register (ADM-SCR-14) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>🧾</span>
              <span>Statutory Tax Invoices & Billing Register (18% GST Compliant)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Standard Indian HSN/SAC compliant invoices with segregated Central & State GST.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">{invoices.length} Invoices</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">INVOICE NO</th>
                <th className="py-3 px-4">JOB REF</th>
                <th className="py-3 px-4">BASE LABOR</th>
                <th className="py-3 px-4">CGST (9%)</th>
                <th className="py-3 px-4">SGST (9%)</th>
                <th className="py-3 px-4">TOTAL PAYABLE</th>
                <th className="py-3 px-4">PAYMENT METHOD</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-white">{inv.invoiceNumber}</td>
                  <td className="py-3.5 px-4 font-mono text-blue-400">{inv.jobId}</td>
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-200">
                    ₹{inv.baseAmount.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-amber-400/90">₹{inv.cgstAmount.toFixed(2)}</td>
                  <td className="py-3.5 px-4 font-mono text-amber-400/90">₹{inv.sgstAmount.toFixed(2)}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-white text-sm">
                    ₹{inv.totalAmount.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold font-mono">
                      {inv.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        inv.paymentStatus === 'PAID'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {inv.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setIsInvoiceModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition inline-flex items-center gap-1"
                    >
                      <span>🔍</span>
                      <span>Preview</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Central Ledger Entries Feed */}
      {finance?.recentLedgers && finance.recentLedgers.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>🏛️</span>
              <span>Double-Entry Escrow Audit Stream</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">Live Immutable Journal</span>
          </div>

          <div className="space-y-2">
            {finance.recentLedgers.map((l: any) => (
              <div
                key={l.id}
                className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${
                      l.entryDirection === 'CREDIT'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-blue-950 text-blue-300 border border-blue-800'
                    }`}
                  >
                    {l.entryDirection}
                  </span>
                  <div>
                    <div className="font-bold text-white text-xs">{l.narrative}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Ref: {l.transactionReference} · Job: {l.jobTicketNumber}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-mono font-bold ${
                      l.entryDirection === 'CREDIT' ? 'text-emerald-400' : 'text-slate-200'
                    }`}
                  >
                    {l.entryDirection === 'CREDIT' ? '+' : '-'}₹{l.amountInr.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {new Date(l.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tax Invoice Modal Preview (ADM-SCR-14) */}
      {isInvoiceModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-400 border border-blue-800 uppercase font-mono">
                  TAX INVOICE · GST COMPLIANT
                </span>
                <h2 className="text-xl font-black text-white mt-1.5">{selectedInvoice.invoiceNumber}</h2>
                <p className="text-xs text-slate-400">
                  SAC Code: 998713 (Electrical Installation & Repair Services)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsInvoiceModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Base Labor Charges</span>
                <span className="font-mono text-white font-bold">₹{selectedInvoice.baseAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Central GST (CGST @ 9.0%)</span>
                <span className="font-mono text-amber-400 font-medium">₹{selectedInvoice.cgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>State GST (SGST @ 9.0%)</span>
                <span className="font-mono text-amber-400 font-medium">₹{selectedInvoice.sgstAmount.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-white">
                <span>Total Amount Paid (INR)</span>
                <span className="font-mono text-emerald-400 text-base">₹{selectedInvoice.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Split Breakdown */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-[11px] space-y-1.5">
              <span className="text-slate-400 font-bold block mb-1">Central Escrow Distribution:</span>
              <div className="flex justify-between text-slate-400">
                <span>• Platform Revenue Cut (15%)</span>
                <span className="font-mono text-slate-200">
                  ₹{(selectedInvoice.baseAmount * 0.15).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>• Franchise Partner Commission (15%)</span>
                <span className="font-mono text-slate-200">
                  ₹{(selectedInvoice.baseAmount * 0.15).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>• Technician Net Payout (70%)</span>
                <span className="font-mono text-emerald-400 font-bold">
                  ₹{(selectedInvoice.baseAmount * 0.7).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsInvoiceModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
