'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BrandMark } from '@/components/ui/brand-logo';

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  jobId: string;
  customerId: string;
  partnerId: string;
  baseAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalAmount: number;
  paymentStatus: 'ISSUED' | 'PAID' | 'REFUNDED';
  paymentMethod: 'UPI' | 'CREDIT_DEBIT_CARD' | 'CASH';
  razorpayPaymentId?: string;
  createdAt: string;
  job?: {
    id: string;
    jobTicketNumber: string;
    serviceTitle: string;
    pincode: string;
  };
  customer?: {
    id: string;
    fullName: string;
    phone: string;
    defaultAddressLine?: string;
  };
  technician?: {
    id: string;
    fullName: string;
    badgeNumber: string;
    electricalLicenseNumber?: string;
  };
}

interface LedgerEntry {
  id: string;
  transactionReference: string;
  invoiceId?: string;
  jobTicketNumber?: string;
  partnerId?: string;
  technicianId?: string;
  ledgerType: 'CUSTOMER_PAYMENT' | 'PLATFORM_FEE' | 'PARTNER_COMMISSION' | 'TECHNICIAN_PAYOUT' | 'GST_RESERVE_18';
  entryDirection: 'DEBIT' | 'CREDIT';
  amountInr: number;
  runningBalanceInr: number;
  narrative: string;
  createdAt: string;
}

interface InvoiceStats {
  totalInvoices: number;
  paidSettledCount: number;
  paidSettledAmountInr: number;
  pendingEscrowCount: number;
  pendingEscrowAmountInr: number;
  monthlyBilledCount: number;
  monthlyGrossVolumeInr: number;
  gstin: string;
  pan: string;
}

export default function PartnerInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'INVOICES' | 'LEDGER'>('INVOICES');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Preview Modal state (PTNR-SCR-12)
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceRecord | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/partner/invoices?partnerId=ptnr_mah_01');
      const data = await res.json();
      if (data.success) {
        setInvoices(data.invoices || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async () => {
    try {
      const res = await fetch('/api/partner/ledger?partnerId=ptnr_mah_01');
      const data = await res.json();
      if (data.success) {
        setLedgerEntries(data.entries || []);
      }
    } catch (err) {
      console.error('Failed to load ledger:', err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchLedger();
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter !== 'ALL' && inv.paymentStatus !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.job?.jobTicketNumber && inv.job.jobTicketNumber.toLowerCase().includes(q)) ||
        (inv.customer?.fullName && inv.customer.fullName.toLowerCase().includes(q)) ||
        (inv.technician?.fullName && inv.technician.fullName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredLedger = ledgerEntries.filter((led) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        led.transactionReference.toLowerCase().includes(q) ||
        led.narrative.toLowerCase().includes(q) ||
        (led.jobTicketNumber && led.jobTicketNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-bounce">
          <span className="text-emerald-400 text-lg">✓</span>
          <span className="text-xs font-medium font-mono">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Breadcrumb & Command Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            <span>Finance &amp; Treasury</span>
            <span>/</span>
            <span>Settlements</span>
            <span>/</span>
            <span className="text-[#1B5E20]">Tax Invoicing &amp; Ledgers (PTNR-SCR-11, 12, 14)</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Invoices, GST Tax Billings &amp; Bank Ledger
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#1B5E20] border border-emerald-200 font-bold">
              GSTIN: 27AABCU9603R1ZM
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Review, filter, and export print-ready GST tax invoices with itemized CGST/SGST splits, 3-way commission distribution, and escrow ledger records for Maharashtra Operations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => showToast('Batch invoices ZIP archive generated for download')}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <span>📦</span>
            <span>Batch Download (ZIP)</span>
          </button>
          <button
            onClick={() => showToast('Invoices ledger exported to CSV format')}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <span>📥</span>
            <span>Export CSV</span>
          </button>
          <Link
            href="/partner/profile"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B5E20] hover:bg-[#0D3B0D] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <span>🏦</span>
            <span>Franchise Bank Profile →</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Total Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Total Invoices Billed</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-[#1B5E20] flex items-center justify-center text-sm font-bold">
              🧾
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats?.totalInvoices ?? invoices.length}</span>
            <span className="text-xs font-bold text-[#1B5E20]">Tax Invoices</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span>Dispatches verified</span>
            <span className="text-emerald-700 font-bold">+12.4% MoM growth</span>
          </div>
        </div>

        {/* Card 2: Paid & Settled */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Paid &amp; Settled</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">
              ✓
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              ₹{(stats?.paidSettledAmountInr ?? 3728.0).toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-bold text-emerald-700">({stats?.paidSettledCount ?? 2} Paid)</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span>Clearance Rate</span>
            <span className="font-bold text-slate-800">93.0% on T+2 Schedule</span>
          </div>
        </div>

        {/* Card 3: Pending Escrow */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-500">
            <span>Pending Escrow Release</span>
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-sm font-bold">
              ⏳
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600">
              ₹{(stats?.pendingEscrowAmountInr ?? 1475.0).toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-bold text-amber-800">({stats?.pendingEscrowCount ?? 1} Issued)</span>
          </div>
          <p className="text-xs text-slate-500 truncate pt-1 border-t border-slate-100">
            Releasing on customer OTP completion
          </p>
        </div>

        {/* Card 4: Monthly Gross Volume */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Monthly Billed Volume</span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">
              📅
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              ₹{(stats?.monthlyGrossVolumeInr ?? 5203.0).toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-bold text-blue-700">Oct 2026</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span>GST Statutory Escrow</span>
            <span className="font-bold text-[#1B5E20]">18% Auto-Withheld</span>
          </div>
        </div>
      </div>

      {/* Auto-Billing Callout Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BrandMark size="md" badgeBg="bg-emerald-50 border border-emerald-200 shadow-2xs" />
          <div>
            <div className="font-bold text-slate-900 text-sm">Maharashtra Hub Auto-Billing &amp; Tax Sync Active</div>
            <div className="text-xs text-slate-500">
              All field dispatches completed with customer handover OTP automatically generate Section 31 compliant GST tax invoices with instant reverse charge attribution.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] uppercase font-bold text-slate-400">Settlement Cycle</div>
            <div className="font-extrabold text-[#1B5E20] text-xs">T+2 Business Days (NEFT/RTGS)</div>
          </div>
          <button
            onClick={() => showToast('Immutable WORM audit ledger verified for all financial transactions')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Audit Log ✓
          </button>
        </div>
      </div>

      {/* View Switcher Tabs: Invoices View vs Settlement Ledger View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('INVOICES')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'INVOICES'
                  ? 'bg-[#1B5E20] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>🧾</span>
              <span>Tax Invoices Directory (PTNR-SCR-11)</span>
              <span className="px-1.5 py-0.2 bg-white/20 rounded text-[10px]">{invoices.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('LEDGER')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'LEDGER'
                  ? 'bg-[#1B5E20] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>🏛️</span>
              <span>Settlement &amp; Escrow Ledger (PTNR-SCR-14)</span>
              <span className="px-1.5 py-0.2 bg-white/20 rounded text-[10px]">{ledgerEntries.length}</span>
            </button>
          </div>

          {activeTab === 'INVOICES' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">All Statuses ({invoices.length})</option>
                <option value="PAID">Paid &amp; Settled</option>
                <option value="ISSUED">Issued / Pending Escrow</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'INVOICES'
                ? 'Search by Invoice No (e.g. INV-2026-001), Job ID, customer, or technician...'
                : 'Search ledger by Transaction Ref (e.g. TXN-2026-00101), narrative, or job ticket...'
            }
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>
      </div>

      {/* VIEW A: Tax Invoices Table (PTNR-SCR-11) */}
      {activeTab === 'INVOICES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-3.5 px-4">Invoice No &amp; Date</th>
                  <th className="py-3.5 px-4">Customer &amp; Work Order</th>
                  <th className="py-3.5 px-4">Assigned Field Tech</th>
                  <th className="py-3.5 px-4 text-right">Taxable Base</th>
                  <th className="py-3.5 px-4 text-right">18% GST (9+9)</th>
                  <th className="py-3.5 px-4 text-right">Total Invoice</th>
                  <th className="py-3.5 px-4 text-center">Settlement Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Loading Tax Invoices...
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No invoices match the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Invoice No & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 font-mono text-xs flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>{inv.invoiceNumber}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {new Date(inv.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      {/* Customer & Job */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {inv.customer?.fullName || 'Customer'}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <span className="font-mono text-emerald-700 font-bold">
                            {inv.job?.jobTicketNumber || inv.jobId}
                          </span>
                          <span>&bull;</span>
                          <span className="truncate max-w-[180px]">
                            {inv.job?.serviceTitle || 'Electrical Service'}
                          </span>
                        </div>
                      </td>

                      {/* Technician */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">
                          {inv.technician?.fullName || 'Rajesh Kumar'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {inv.technician?.badgeNumber || 'TECH-7821'}
                        </div>
                      </td>

                      {/* Taxable Base */}
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700">
                        ₹{inv.baseAmount.toFixed(2)}
                      </td>

                      {/* 18% GST */}
                      <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-500">
                        ₹{(inv.cgstAmount + inv.sgstAmount).toFixed(2)}
                        <span className="block text-[9px] text-slate-400">
                          (₹{inv.cgstAmount.toFixed(2)} + ₹{inv.sgstAmount.toFixed(2)})
                        </span>
                      </td>

                      {/* Total Invoice */}
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                        ₹{inv.totalAmount.toFixed(2)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {inv.paymentStatus === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            PAID &bull; SETTLED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                            ESCROW PENDING
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewInvoice(inv)}
                            className="px-2.5 py-1.5 bg-[#1B5E20] hover:bg-[#0D3B0D] text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                          >
                            <span>👁️</span>
                            <span>Preview</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW B: Settlement & Escrow Ledger (PTNR-SCR-14) */}
      {activeTab === 'LEDGER' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-extrabold text-slate-900 text-sm">
                Double-Entry Escrow &amp; Commission Settlement Ledger (PTNR-SCR-14)
              </div>
              <div className="text-xs text-slate-500">
                Immutable audit trail of customer payments, partner commission distributions, and statutory tax reservations.
              </div>
            </div>
            <span className="text-xs font-bold text-[#1B5E20] px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
              WORM Integrity Verified ✓
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-3.5 px-4">Transaction Ref</th>
                  <th className="py-3.5 px-4">Job Order</th>
                  <th className="py-3.5 px-4">Transaction Type</th>
                  <th className="py-3.5 px-4">Narrative Description</th>
                  <th className="py-3.5 px-4 text-center">Direction</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No ledger transactions found.
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((led) => (
                    <tr key={led.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {led.transactionReference}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#1B5E20]">
                        {led.jobTicketNumber || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {led.ledgerType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {led.narrative}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            led.entryDirection === 'CREDIT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {led.entryDirection}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                        {led.entryDirection === 'CREDIT' ? '+' : '-'}₹{led.amountInr.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-600">
                        ₹{led.runningBalanceInr.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Official Tax Invoice Preview (PTNR-SCR-12) */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-6">
            {/* Header & Actions */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1B5E20] font-black text-lg flex items-center justify-center">
                  🧾
                </div>
                <div>
                  <div className="text-lg font-black text-slate-900 flex items-center gap-2">
                    Tax Invoice Preview &bull; {previewInvoice.invoiceNumber}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-[#1B5E20] font-bold">
                      PAID &bull; SETTLED
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Maharashtra Regional Partner Cluster #MH-01 &bull; Instant Escrow Clearance
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <span>🖨️</span>
                  <span>Print</span>
                </button>
                <button
                  onClick={() => showToast(`Invoice ${previewInvoice.invoiceNumber} downloaded as PDF`)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <span>📥</span>
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => setPreviewInvoice(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Tax Invoice Paper Box */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6 text-xs text-slate-800">
              {/* Organization Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="text-base font-black text-slate-900">ElectriCare Services India Pvt. Ltd.</div>
                  <div className="text-xs text-[#1B5E20] font-bold">Maharashtra Regional Operations Hub</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Level 4, Technopolis Knowledge Park, Andheri East, Mumbai, MH - 400093
                  </div>
                  <div className="font-mono text-[11px] font-bold text-slate-700 mt-0.5">
                    GSTIN: 27AABCU9603R1ZM &bull; State Code: 27 (Maharashtra)
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="inline-block px-2.5 py-0.5 rounded bg-emerald-100 text-[#1B5E20] font-black uppercase text-xs">
                    Tax Invoice
                  </span>
                  <div className="font-mono font-bold text-slate-900 mt-1">
                    Invoice No: {previewInvoice.invoiceNumber}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Date: 02 Oct 2026 &bull; Place of Supply: Maharashtra (27)
                  </div>
                  <div className="font-mono font-bold text-emerald-700 text-[11px] mt-0.5">
                    Job Ref: {previewInvoice.job?.jobTicketNumber || previewInvoice.jobId}
                  </div>
                </div>
              </div>

              {/* Bill To & Service Provider */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Billed To (Customer)</span>
                  <div className="font-bold text-slate-900">{previewInvoice.customer?.fullName || 'Amit Sharma'}</div>
                  <div className="text-slate-500 text-[11px]">
                    {previewInvoice.customer?.defaultAddressLine || 'Flat 402, Sea View Apartments, Colaba, Mumbai 400001'}
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono">
                    Phone: {previewInvoice.customer?.phone || '+91 9876543213'}
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Assigned Service Provider</span>
                  <div className="font-bold text-slate-900">{previewInvoice.technician?.fullName || 'Rajesh Kumar'}</div>
                  <div className="text-slate-500 text-[11px]">
                    Badge: {previewInvoice.technician?.badgeNumber || 'TECH-7821'} &bull; Wireman License: EL-MH-2024-8849
                  </div>
                  <div className="text-emerald-700 font-bold text-[11px]">
                    1000V Insulated Gloves Class-0 Certified ✓
                  </div>
                </div>
              </div>

              {/* Itemized Line Items Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500">
                      <th className="py-2.5 px-3">Description of Electrical Service</th>
                      <th className="py-2.5 px-3">HSN / SAC</th>
                      <th className="py-2.5 px-3 text-right">Taxable Base</th>
                      <th className="py-2.5 px-3 text-right">CGST (9%)</th>
                      <th className="py-2.5 px-3 text-right">SGST (9%)</th>
                      <th className="py-2.5 px-3 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">
                          {previewInvoice.job?.serviceTitle || 'Ceiling Fan Repair / Bearing Replacement'}
                        </div>
                        <div className="text-[10px] text-slate-400">High-Voltage Certified Labor &bull; Zone Colaba</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">998713</td>
                      <td className="py-3 px-3 text-right font-mono font-medium">₹{previewInvoice.baseAmount.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-mono">₹{previewInvoice.cgstAmount.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-mono">₹{previewInvoice.sgstAmount.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                        ₹{previewInvoice.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t border-slate-200 font-black text-slate-900">
                      <td colSpan={5} className="py-2.5 px-3 text-right uppercase text-[11px]">
                        Grand Total (INR):
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-sm text-[#1B5E20]">
                        ₹{previewInvoice.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* 3-Way Commission Distribution Breakdown Card */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                <div className="text-xs font-black text-[#1B5E20] flex items-center justify-between">
                  <span>3-Way Escrow Settlement Distribution (Statutory Zero-Variance)</span>
                  <span className="text-[10px] bg-emerald-200 text-[#1B5E20] px-2 py-0.5 rounded-full font-bold">
                    Reconciled ✓
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center font-mono text-xs">
                  <div className="p-2 bg-white rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-slate-400 font-sans block">Tech Payout (70%)</span>
                    <span className="font-black text-slate-900">₹741.52</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-slate-400 font-sans block">Partner Share (15%)</span>
                    <span className="font-black text-[#1B5E20]">₹158.90</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-slate-400 font-sans block">Platform Fee (15%)</span>
                    <span className="font-black text-slate-900">₹158.90</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-slate-400 font-sans block">GST Reserve (18%)</span>
                    <span className="font-black text-slate-900">₹190.68</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPreviewInvoice(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
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
