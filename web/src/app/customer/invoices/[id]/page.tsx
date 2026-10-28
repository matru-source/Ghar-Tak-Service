'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Zap,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Check,
  Star,
  Receipt,
  Navigation,
  Calendar,
  Home,
  User,
} from '@/components/ui/icons';
import { BrandLogo, BrandMark } from '@/components/ui/brand-logo';

export default function CustomerInvoiceDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawId = (params?.id as string) || '';

  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [ratingFeedback, setRatingFeedback] = useState<string>('Exceptional! • Feedback submitted');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const [customerName, setCustomerName] = useState<string>('Valued Customer');
  const [customerAddress, setCustomerAddress] = useState<string>('Doorstep Service Location');
  const [technicianName, setTechnicianName] = useState<string>('Assigned Fleet Technician');
  const [technicianBadge, setTechnicianBadge] = useState<string>('#TECH-VERIFIED');
  const [invoiceNumber, setInvoiceNumber] = useState<string>(rawId ? `#${rawId}` : '#INV-2026-001');
  const [serviceDate, setServiceDate] = useState<string>('Today, 11:45 AM');
  const [invoiceData, setInvoiceData] = useState({
    serviceTitle: 'Professional Doorstep Service',
    baseAmount: 1059.32,
    cgstAmount: 95.34,
    sgstAmount: 95.34,
    totalAmount: 1250.00,
    paymentMethod: 'UPI (Google Pay)',
    hsnCode: '9987',
  });

  useEffect(() => {
    let invNum = rawId || searchParams.get('invoiceNumber') || searchParams.get('invoice') || '';
    let ticketNum = searchParams.get('ticket') || searchParams.get('jobId') || '';

    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('gts_customer_name') || localStorage.getItem('key_user_name');
        const storedAddr = localStorage.getItem('gts_customer_address') || localStorage.getItem('key_user_address');
        const storedTech = localStorage.getItem('gts_active_tech_name') || localStorage.getItem('key_active_job_tech_name');
        const storedBadge = localStorage.getItem('gts_active_tech_badge') || localStorage.getItem('key_active_job_tech_badge');
        const storedInv = localStorage.getItem('gts_active_invoice_no') || localStorage.getItem('key_active_job_ticket_no');

        if (storedUser) setCustomerName(storedUser);
        if (storedAddr) setCustomerAddress(storedAddr);
        if (storedTech) setTechnicianName(storedTech);
        if (storedBadge) setTechnicianBadge(storedBadge.startsWith('#') ? storedBadge : `#${storedBadge}`);
        if (storedInv && !invNum) setInvoiceNumber(storedInv.startsWith('#') ? storedInv : `#${storedInv}`);

        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        setServiceDate(`Today, ${timeStr}`);
      } catch {}
    }

    const fetchLiveInvoice = async () => {
      try {
        if (invNum) {
          const res = await fetch(`/api/partner/invoices?invoiceNumber=${encodeURIComponent(invNum.replace(/^#/, ''))}`);
          const data = await res.json();
          if (data.success && data.invoice) {
            const inv = data.invoice;
            setInvoiceNumber(inv.invoiceNumber.startsWith('#') ? inv.invoiceNumber : `#${inv.invoiceNumber}`);
            if (inv.customer?.fullName) setCustomerName(inv.customer.fullName);
            if (inv.job?.customerAddressText) setCustomerAddress(inv.job.customerAddressText);
            if (inv.job?.technicianName) setTechnicianName(inv.job.technicianName);
            if (inv.technician?.badgeNumber) setTechnicianBadge(`#${inv.technician.badgeNumber.replace(/^#/, '')}`);
            setInvoiceData({
              serviceTitle: inv.job?.serviceTitle || 'Professional Doorstep Service',
              baseAmount: inv.baseAmount,
              cgstAmount: inv.cgstAmount,
              sgstAmount: inv.sgstAmount,
              totalAmount: inv.totalAmount,
              paymentMethod: inv.paymentMethod || 'UPI',
              hsnCode: '9987',
            });
            return;
          }
        }

        const query = ticketNum || invNum || 'INV-2026-001';
        const res = await fetch(`/api/partner/invoices?search=${encodeURIComponent(query.replace(/^#/, ''))}`);
        const data = await res.json();
        if (data.success && data.invoices && data.invoices.length > 0) {
          const inv = data.invoices[0];
          setInvoiceNumber(inv.invoiceNumber.startsWith('#') ? inv.invoiceNumber : `#${inv.invoiceNumber}`);
          if (inv.customer?.fullName) setCustomerName(inv.customer.fullName);
          if (inv.job?.customerAddressText) setCustomerAddress(inv.job.customerAddressText);
          if (inv.job?.technicianName) setTechnicianName(inv.job.technicianName);
          if (inv.technician?.badgeNumber) setTechnicianBadge(`#${inv.technician.badgeNumber.replace(/^#/, '')}`);
          setInvoiceData({
            serviceTitle: inv.job?.serviceTitle || 'Professional Doorstep Service',
            baseAmount: inv.baseAmount,
            cgstAmount: inv.cgstAmount,
            sgstAmount: inv.sgstAmount,
            totalAmount: inv.totalAmount,
            paymentMethod: inv.paymentMethod || 'UPI',
            hsnCode: '9987',
          });
        }
      } catch (err) {
        console.warn('Failed to fetch live invoice:', err);
      }
    };

    fetchLiveInvoice();
  }, [rawId, searchParams]);

  const labels = ['Poor', 'Fair', 'Good', 'Very Good', 'Exceptional!'];

  const handleStarClick = (rating: number) => {
    setSelectedRating(rating);
    setRatingFeedback(`${labels[rating - 1]} • Thank you for your rating!`);
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  const handleShareReceipt = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`Ghar Tak Service Official Tax Invoice ${invoiceNumber} (₹${invoiceData.totalAmount.toFixed(2)} Paid) - ${customerAddress}`);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white text-slate-900 pb-24 select-none print:p-0">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 shadow-2xs print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link
              href="/customer/history"
              className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <BrandMark size="xs" badgeBg="bg-blue-50 border border-blue-200 shadow-2xs" />
              <h1 className="font-extrabold text-sm text-slate-900">Tax Invoice Receipt</h1>
            </div>
          </div>

          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Paid in Full
          </span>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 px-4 py-4 space-y-4">
        {/* Success Milestone Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-600 rounded-2xl p-4 text-white shadow-sm flex items-center gap-3.5 relative overflow-hidden">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
          <div className="min-w-0 pr-4">
            <span className="text-[10px] uppercase tracking-wider text-emerald-200 font-extrabold block">
              Service Milestone
            </span>
            <h2 className="text-base font-extrabold text-white leading-tight mt-0.5">
              Job Completed Successfully!
            </h2>
            <p className="text-xs text-emerald-100 mt-0.5">Mains restored & safety inspected</p>
          </div>
          <div className="absolute -right-4 -bottom-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
        </div>

        {/* Primary Invoice Details Card */}
        <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200">
          {/* Corporate Brand Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <BrandLogo variant="on-light" size="sm" priority />
            <div className="text-right">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">GTS GHAR TAK SERVICE</span>
              <span className="text-[9px] font-mono text-slate-400">GSTIN: 27AABCU9603R1ZM</span>
            </div>
          </div>

          <div className="flex items-start justify-between gap-2 p-3 bg-slate-50 rounded-xl mb-3 border border-slate-100">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                TAX INVOICE NUMBER
              </span>
              <span className="font-mono text-sm font-extrabold text-slate-900">{invoiceNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                SERVICED ON
              </span>
              <span className="text-xs font-bold text-slate-900">{serviceDate}</span>
            </div>
          </div>

          {/* Customer & Technician Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Customer</span>
              </div>
              <p className="font-extrabold text-xs text-slate-900 truncate">{customerName}</p>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{customerAddress}</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Serviced By</span>
              </div>
              <p className="font-extrabold text-xs text-slate-900 truncate">{technicianName}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] font-mono font-bold text-blue-700">{technicianBadge}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <span className="text-[10px] text-emerald-700 font-bold">Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Itemized Cost Breakdown Card */}
        <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-slate-900">Cost Breakdown</h3>
            </div>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              HSN Code 9987
            </span>
          </div>

          <div className="space-y-2 pt-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">{invoiceData.serviceTitle}</span>
                <span className="text-[10px] text-slate-500">Standard Labor (1 Unit)</span>
              </div>
              <span className="font-mono font-bold text-slate-900">₹{invoiceData.baseAmount.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Warranty & Safety Inspection Protocol</span>
                <span className="text-[10px] text-slate-500">1000V Insulated Safety Standard</span>
              </div>
              <span className="font-mono font-bold text-slate-900">₹0.00 (Included)</span>
            </div>

            {/* GST Box */}
            <div className="bg-slate-50 rounded-xl p-2.5 my-1.5 space-y-1 text-slate-600 border border-slate-100">
              <div className="flex items-center justify-between text-[11px]">
                <span>Central GST (CGST 9%):</span>
                <span className="font-mono font-bold text-slate-900">₹{invoiceData.cgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span>State GST (SGST 9%):</span>
                <span className="font-mono font-bold text-slate-900">₹{invoiceData.sgstAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="flex items-center justify-between bg-blue-50/70 p-3 rounded-xl border border-blue-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block">
                  TOTAL AMOUNT PAID
                </span>
                <span className="text-[10px] text-slate-500">Inclusive of statutory 18% GST</span>
              </div>
              <span className="font-mono font-black text-lg text-blue-700">₹{invoiceData.totalAmount.toFixed(2)}</span>
            </div>

            {/* Payment Transaction Details */}
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <span className="font-bold text-slate-900 block">Paid via {invoiceData.paymentMethod}</span>
                <span className="text-[10px] font-mono text-slate-500">Transaction Ref: UPI-84920491</span>
              </div>
            </div>
          </div>
        </div>

        {/* Work Verification Evidence (Before & After) */}
        <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-slate-900">Work Verification Evidence</h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[3]" />
              Audit Clean
            </span>
          </div>

          {/* Before & After Comparison */}
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            <div className="flex flex-col">
              <div className="relative aspect-[4/3] rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="absolute top-1.5 left-1.5 bg-slate-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  Before
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium text-center mt-1">
                Inspected Connection
              </span>
            </div>

            <div className="flex flex-col">
              <div className="relative aspect-[4/3] rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <span className="absolute top-1.5 left-1.5 bg-emerald-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  After
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium text-center mt-1">
                Completed & Verified
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200 mt-3 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-900 leading-snug">
              <strong>Safety Protocol Passed:</strong> 1,000V Insulated equipment verified, Mains checked, load test calibrated at 230V.
            </p>
          </div>
        </div>

        {/* 5-Star Interactive Rating Card */}
        <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200 text-center">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-1.5">
            <Star className="w-5 h-5 fill-current" />
          </div>
          <h3 className="font-bold text-xs text-slate-900">Rate Your Service Experience</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">How was {technicianName || 'your technician'}&apos;s service today?</p>

          <div className="flex items-center justify-center gap-2 my-2.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleStarClick(star)}
                className="p-1 hover:scale-110 active:scale-95 transition-transform"
                title={`${star} Star`}
              >
                <Star
                  className={`w-7 h-7 transition-colors ${
                    star <= selectedRating ? 'text-amber-500 fill-current' : 'text-slate-300'
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="text-xs font-bold text-amber-800 bg-amber-50 py-1.5 px-3 rounded-lg border border-amber-200 inline-block">
            {ratingFeedback}
          </div>
        </div>

        {/* Sticky Actions Bar */}
        <div className="pt-2 space-y-2 print:hidden">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Receipt className="w-4 h-4" />
            <span>Download & Print PDF Tax Invoice</span>
          </button>

          <button
            type="button"
            onClick={handleShareReceipt}
            className="w-full py-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <span>{isCopied ? 'Receipt Link Copied!' : 'Share Invoice Receipt'}</span>
          </button>
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full max-w-[430px] z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_16px_rgba(11,28,48,0.06)] print:hidden">
        <div className="flex justify-around items-center h-15 px-2">
          <Link
            href="/customer"
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] tracking-tight font-medium">Home</span>
          </Link>
          <Link
            href="/customer/bookings"
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] tracking-tight font-medium">Bookings</span>
          </Link>
          <Link
            href="/customer/track"
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Navigation className="w-5 h-5" />
            <span className="text-[10px] tracking-tight font-medium">Track</span>
          </Link>
          <Link
            href="/customer/history"
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 text-blue-600 font-bold"
          >
            <Receipt className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">History</span>
          </Link>
          <Link
            href="/customer/login"
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] tracking-tight font-medium">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
