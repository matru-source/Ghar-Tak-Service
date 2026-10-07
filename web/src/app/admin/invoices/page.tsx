'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BrandLogo, BrandMark } from '@/components/ui/brand-logo';

interface AdminInvoice {
  id: string;
  invoiceNumber: string;
  jobId: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  customerAddressText?: string;
  partnerId?: string;
  partnerName?: string;
  technicianName?: string;
  serviceTitle?: string;
  baseAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalAmount: number;
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED';
  paymentMethod?: string;
  sacCode?: string;
  createdAt: string;
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<AdminInvoice | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/invoices');
      const json = await res.json();
      if (json.success && json.data?.invoices) {
        setInvoices(json.data.invoices);
      }
    } catch {
      showToast('Error loading tax invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter !== 'ALL' && inv.paymentStatus !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchNum = inv.invoiceNumber?.toLowerCase().includes(q);
      const matchCust = inv.customerName?.toLowerCase().includes(q);
      const matchPhone = inv.customerPhone?.includes(q);
      const matchJob = inv.jobId?.toLowerCase().includes(q);
      if (!matchNum && !matchCust && !matchPhone && !matchJob) return false;
    }
    return true;
  });

  const totalBilledGmv = invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  const totalBaseLabor = invoices.reduce((sum, i) => sum + (i.baseAmount || 0), 0);
  const totalGstEscrow = invoices.reduce((sum, i) => sum + ((i.cgstAmount || 0) + (i.sgstAmount || 0)), 0);
  const paidCount = invoices.filter((i) => i.paymentStatus === 'PAID').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 flex items-center gap-2">
          <BrandMark size="xs" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              18% GST Statutory Tax Invoices
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
              SAC 9987 COMPLIANT
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            GSTR-1 & GSTR-3B tax invoice repository, 9% CGST + 9% SGST escrow reconciliation & customer tax receipts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <span>🔄</span>
            <span>Refresh Invoices</span>
          </button>
          <Link
            href="/admin/finance"
            className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <span>🏦</span>
            <span>Central Ledgers & Escrow</span>
          </Link>
        </div>
      </div>

      {/* Financial Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Total Invoices Issued</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{invoices.length}</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-0.5">{paidCount} Settled / Paid</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Gross Billed GMV</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            ₹{totalBilledGmv.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Base + 18% GST</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Base Labor Billed</div>
          <div className="text-2xl font-black text-slate-800 mt-1 font-mono">
            ₹{totalBaseLabor.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Pre-tax electrical labor</div>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 shadow-xs">
          <div className="text-[11px] font-bold text-purple-700 uppercase">18% GST Withheld (Escrow)</div>
          <div className="text-2xl font-black text-purple-900 mt-1 font-mono">
            ₹{totalGstEscrow.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-purple-600 mt-0.5">9% CGST + 9% SGST</div>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setStatusFilter('PAID')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'PAID' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paid ({paidCount})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'PENDING' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending
            </button>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search invoice #, customer, ticket..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-80 pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50 focus:bg-white"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice # & Date</th>
                <th className="py-3 px-4">Job Ticket</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">SAC Code</th>
                <th className="py-3 px-4 text-right">Base Labor (₹)</th>
                <th className="py-3 px-4 text-right">CGST 9% (₹)</th>
                <th className="py-3 px-4 text-right">SGST 9% (₹)</th>
                <th className="py-3 px-4 text-right">Total Invoice (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && invoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <span className="inline-block animate-spin mr-2">🔄</span>
                    Loading tax invoice records...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No tax invoices found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-purple-900">{inv.invoiceNumber}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {inv.jobId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{inv.customerName || 'Customer'}</div>
                      <div className="text-[10px] text-slate-500">{inv.customerPhone}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {inv.sacCode || '9987'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                      ₹{inv.baseAmount?.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      ₹{inv.cgstAmount?.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      ₹{inv.sgstAmount?.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{inv.totalAmount?.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        inv.paymentStatus === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                      >
                        Inspect Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official GST Tax Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <BrandLogo variant="on-light" size="sm" />
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-purple-700">
                    Official Statutory Tax Invoice
                  </div>
                  <div className="font-mono font-extrabold text-base text-slate-900">
                    {selectedInvoice.invoiceNumber}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Corporate & GST Details */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Service Provider</span>
                <div className="font-extrabold text-slate-900 mt-0.5">Ghar Tak Service (GTS)</div>
                <div className="text-slate-500 text-[11px]">ElectriCare Technologies Pvt Ltd</div>
                <div className="font-mono text-[10px] text-purple-700 font-bold mt-1">
                  GSTIN: 27AABCU9603R1ZM
                </div>
                <div className="text-slate-500 text-[10px]">Mumbai Hub MH-01, Maharashtra</div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Recipient (Customer)</span>
                <div className="font-extrabold text-slate-900 mt-0.5">{selectedInvoice.customerName || 'Customer'}</div>
                <div className="text-slate-500 text-[11px]">{selectedInvoice.customerPhone}</div>
                <div className="text-slate-500 text-[10px] mt-0.5">{selectedInvoice.customerAddressText || 'Customer Doorstep Address'}</div>
                <div className="text-[10px] text-slate-400 mt-1">Place of Supply: Maharashtra (27)</div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Description of Service</th>
                    <th className="py-2.5 px-3">SAC</th>
                    <th className="py-2.5 px-3 text-right">Taxable Amt</th>
                    <th className="py-2.5 px-3 text-right">CGST 9%</th>
                    <th className="py-2.5 px-3 text-right">SGST 9%</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {selectedInvoice.serviceTitle || 'Professional Electrical Diagnostic & Repair Work'}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">9987</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">₹{selectedInvoice.baseAmount?.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">₹{selectedInvoice.cgstAmount?.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">₹{selectedInvoice.sgstAmount?.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">₹{selectedInvoice.totalAmount?.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Summary */}
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-purple-700">Payment Status:</span>
                <span className="ml-2 font-black text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {selectedInvoice.paymentStatus}
                </span>
                <div className="text-[10px] text-slate-400 mt-1">Computer-generated statutory tax receipt.</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase text-purple-600 font-bold">Total Invoiced Amount</div>
                <div className="font-mono font-black text-xl text-slate-900">₹{selectedInvoice.totalAmount?.toFixed(2)}</div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition flex items-center gap-1.5"
              >
                <span>🖨️</span>
                <span>Print Tax Invoice</span>
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
