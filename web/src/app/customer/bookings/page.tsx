'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Clock,
  CreditCard,
  QrCode,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Wrench,
  Check,
  Sparkles,
  AlertTriangle,
  Home,
  Calendar,
  Receipt,
  Navigation,
  User,
  X,
} from '@/components/ui/icons';
import { BrandLogo, BrandMark } from '@/components/ui/brand-logo';

interface CatalogService {
  id: string;
  code: string;
  title: string;
  categoryId: string;
  categoryName: string;
  basePriceInr: number;
  estimatedDurationMinutes: number;
  isEmergencySosEligible: boolean;
  pricing: {
    baseAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    totalGstAmount: number;
    totalPayableInr: number;
    formatted: string;
  };
}

export default function CustomerBookingsPage() {
  const router = useRouter();

  // Booking Flow Steps: 1: Service & Slot, 2: Address & Notes, 3: Payment Checkout, 4: Confirmed
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [servicesList, setServicesList] = useState<CatalogService[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('srv_fan_01');
  const [isEmergency, setIsEmergency] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<string>('Today • Immediate (15-25 Mins)');
  const [addressLine, setAddressLine] = useState<string>('Flat 402, Sea View Apartments, Colaba, Mumbai');
  const [pincode, setPincode] = useState<string>('400001');
  const [customerNotes, setCustomerNotes] = useState<string>('Ceiling fan making screeching noise and regulator sparking');
  const [mcbConfirmed, setMcbConfirmed] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING' | 'CASH'>('UPI');

  // Order Result
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdJob, setCreatedJob] = useState<{
    id: string;
    jobTicketNumber: string;
    technicianName: string;
    handoverOtp: string;
    totalAmountInr: number;
    pincode: string;
  } | null>(null);

  // Load services and session
  useEffect(() => {
    // Read session
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('electriCare_customer_session');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.defaultAddressLine) setAddressLine(parsed.defaultAddressLine);
          if (parsed.defaultPincode) setPincode(parsed.defaultPincode);
        } catch {
          // ignore
        }
      }
    }

    const fetchCatalog = async () => {
      try {
        const res = await fetch('/api/services');
        const data = await res.json();
        if (data.success && data.data?.services) {
          setServicesList(data.data.services);
        }
      } catch (err) {
        console.error('Failed to load catalog', err);
      }
    };
    fetchCatalog();
  }, []);

  const selectedService = servicesList.find((s) => s.id === selectedServiceId) || servicesList[0] || {
    id: 'srv_fan_01',
    code: 'SRV-FAN-01',
    title: 'Ceiling Fan Repair / Bearing Replacement',
    categoryId: 'cat_repairs',
    categoryName: 'Electrical Repairs',
    basePriceInr: 1059.32,
    estimatedDurationMinutes: 45,
    isEmergencySosEligible: false,
    pricing: {
      baseAmount: 1059.32,
      cgstAmount: 95.34,
      sgstAmount: 95.34,
      totalGstAmount: 190.68,
      totalPayableInr: 1250.0,
      formatted: '₹1,250',
    },
  };

  // Pricing calculations
  const emergencyPremium = isEmergency ? selectedService.basePriceInr * 0.2 : 0;
  const taxableBase = selectedService.basePriceInr + emergencyPremium;
  const cgst9 = Math.round(taxableBase * 0.09 * 100) / 100;
  const sgst9 = Math.round(taxableBase * 0.09 * 100) / 100;
  const totalAmount = Math.round((taxableBase + cgst9 + sgst9) * 100) / 100;

  // Handle Submit Order
  const handleConfirmOrder = async () => {
    setErrorMsg(null);
    if (!mcbConfirmed) {
      setErrorMsg('Please confirm that the main MCB power switch can be safely turned off.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: 'cust_amit_01',
          serviceId: selectedService.id,
          pincode: pincode,
          customerAddressText: `${addressLine} (${customerNotes})`,
          priority: isEmergency ? 'EMERGENCY_SOS_247' : 'STANDARD',
          scheduledAt: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place booking order');
      }

      setCreatedJob({
        id: data.data.id,
        jobTicketNumber: data.data.jobTicketNumber,
        technicianName: data.data.technicianName || 'Rajesh Kumar (Lead Tech)',
        handoverOtp: data.data.handoverOtp || '4829',
        totalAmountInr: totalAmount,
        pincode: pincode,
      });

      setCurrentStep(4);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white text-slate-900 pb-20 select-none">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link
              href="/customer"
              className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <BrandMark size="xs" badgeBg="bg-blue-50 border border-blue-200 shadow-2xs" />
            <div>
              <h1 className="font-bold text-sm text-slate-900">Service Booking & Slot</h1>
              <p className="text-[11px] text-slate-500 font-medium">Colaba Hub 400001 • Fast Dispatch</p>
            </div>
          </div>

          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Step {currentStep} of 3
          </span>
        </div>

        {/* Stepper Dots */}
        {currentStep < 4 && (
          <div className="flex items-center justify-between pt-3 px-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                1
              </span>
              <span className="text-[11px] font-bold text-slate-800">Service</span>
            </div>
            <div className="h-0.5 flex-1 mx-2 bg-slate-200">
              <div
                className={`h-full bg-blue-600 transition-all ${
                  currentStep === 1 ? 'w-0' : currentStep === 2 ? 'w-1/2' : 'w-full'
                }`}
              />
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                2
              </span>
              <span className="text-[11px] font-bold text-slate-800">Address</span>
            </div>
            <div className="h-0.5 flex-1 mx-2 bg-slate-200">
              <div
                className={`h-full bg-blue-600 transition-all ${currentStep === 3 ? 'w-full' : 'w-0'}`}
              />
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep === 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                3
              </span>
              <span className="text-[11px] font-bold text-slate-800">Payment</span>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-4 space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: SERVICE & TIME SLOT SELECTION */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Select Electrical Service
              </label>
              <div className="space-y-2">
                {servicesList.slice(0, 5).map((svc) => (
                  <div
                    key={svc.id}
                    onClick={() => setSelectedServiceId(svc.id)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                      selectedServiceId === svc.id
                        ? 'border-blue-600 bg-blue-50/40 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selectedServiceId === svc.id ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                        }`}
                      >
                        {selectedServiceId === svc.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">{svc.title}</div>
                        <div className="text-[10px] text-slate-500">
                          {svc.estimatedDurationMinutes} mins • {svc.categoryName}
                        </div>
                      </div>
                    </div>
                    <span className="font-extrabold text-xs text-blue-700">
                      ₹{Math.round(svc.pricing?.totalPayableInr || svc.basePriceInr * 1.18)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Priority Toggle */}
            <div className="p-3.5 rounded-xl border border-orange-200 bg-orange-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-600 fill-current" />
                <div>
                  <div className="font-bold text-xs text-orange-950">24/7 Rapid SOS Priority</div>
                  <div className="text-[10px] text-orange-800">15-minute guaranteed SLA dispatch (+20%)</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEmergency(!isEmergency)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  isEmergency ? 'bg-orange-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                    isEmergency ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Time Slot Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                2. Choose Dispatch Time Slot
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Today • Immediate (15-25 Mins)',
                  'Today • 02:00 PM - 04:00 PM',
                  'Today • 05:00 PM - 07:00 PM',
                  'Tomorrow • Morning 10:00 AM',
                ].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                      selectedSlot === slot
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-blue-600 mb-1" />
                    <span>{slot}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-all mt-4"
            >
              <span>Continue to Address & Notes</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: ADDRESS & SAFETY INSTRUCTIONS */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Service Delivery Address
              </label>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>Colaba, Mumbai Hub (Pincode: {pincode})</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Serviceable
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Problem Description & Notes
              </label>
              <textarea
                rows={2}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Mention specific symptoms (e.g., spark, burning smell, sound)..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            {/* Mandatory Safety Confirmation Checkbox */}
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mcbConfirmed}
                  onChange={(e) => setMcbConfirmed(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs text-slate-700 font-medium">
                  <strong>Safety Interlock:</strong> I agree that the main electrical switch / MCB will be
                  switched OFF during physical inspection and repair by the licensed electrician.
                </span>
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-1/3 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Review GST & Payment</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: TAX INVOICE & PAYMENT CHECKOUT */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* 18% GST Statutory Breakdown Card */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-xs text-slate-900">Tax Invoice Breakdown</span>
                <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                  HSN 9987
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Base Labor Fee:</span>
                  <span className="font-mono text-slate-900">₹{selectedService.basePriceInr.toFixed(2)}</span>
                </div>
                {isEmergency && (
                  <div className="flex justify-between text-orange-700 font-medium">
                    <span>24/7 SOS Rapid Surcharge (20%):</span>
                    <span className="font-mono">+₹{emergencyPremium.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Statutory CGST (9%):</span>
                  <span className="font-mono text-slate-900">₹{cgst9.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Statutory SGST (9%):</span>
                  <span className="font-mono text-slate-900">₹{sgst9.toFixed(2)}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-sm text-slate-900">
                  <span>Total Amount Payable:</span>
                  <span className="text-blue-700 font-mono">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Payment Mode
              </label>

              <div className="space-y-2">
                {[
                  {
                    id: 'UPI',
                    name: 'UPI Instant (GPay / PhonePe / Paytm / QR)',
                    icon: <QrCode className="w-4 h-4 text-emerald-600" />,
                    badge: 'Instant Zero-Fee',
                  },
                  {
                    id: 'CARD',
                    name: 'Credit / Debit Card (Visa / MC / RuPay)',
                    icon: <CreditCard className="w-4 h-4 text-blue-600" />,
                    badge: '256-Bit SSL',
                  },
                  {
                    id: 'CASH',
                    name: 'Pay After Service (Cash or UPI to Tech)',
                    icon: <CheckCircle2 className="w-4 h-4 text-orange-600" />,
                    badge: 'Post-Handover',
                  },
                ].map((mode) => (
                  <div
                    key={mode.id}
                    onClick={() => setPaymentMethod(mode.id as any)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                      paymentMethod === mode.id
                        ? 'border-blue-600 bg-blue-50/40 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === mode.id ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                        }`}
                      >
                        {paymentMethod === mode.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="flex items-center gap-2">
                        {mode.icon}
                        <span className="font-bold text-xs text-slate-900">{mode.name}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {mode.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-1/3 py-3.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmOrder}
                className="flex-1 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Dispatching Electrician...</span>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Pay ₹{totalAmount.toFixed(0)} & Book Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: ORDER CONFIRMED & HANDOVER OTP SCREEN */}
        {currentStep === 4 && createdJob && (
          <div className="space-y-4 py-4 text-center animate-in zoom-in-95 duration-200">
            <div className="flex justify-center pb-1">
              <BrandLogo variant="on-light" size="sm" priority />
            </div>
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-md shadow-emerald-600/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Dispatch Order Active
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-2">
                Booking Confirmed #{createdJob.jobTicketNumber}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Allocated to Lead Technician <strong>{createdJob.technicianName}</strong>
              </p>
            </div>

            {/* Handover OTP Highlight Card */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 uppercase">Service Handover OTP</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  Confidential
                </span>
              </div>
              <p className="text-[11px] text-amber-800 mt-1">
                Share this 4-digit code with electrician <strong>only after</strong> service completion:
              </p>
              <div className="flex justify-center gap-3 my-3">
                {createdJob.handoverOtp.split('').map((char, i) => (
                  <span
                    key={i}
                    className="w-12 h-14 rounded-xl bg-white border border-amber-300 text-slate-900 flex items-center justify-center font-mono font-extrabold text-2xl shadow-xs"
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                href="/customer/track"
                className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all block"
              >
                <Navigation className="w-4 h-4" />
                <span>Track Live Arrival GPS →</span>
              </Link>

              <Link
                href="/customer"
                className="w-full py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors block"
              >
                Back to Home Dashboard
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full max-w-[430px] z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_16px_rgba(11,28,48,0.06)]">
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
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 text-blue-600 font-bold"
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Bookings</span>
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
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Receipt className="w-5 h-5" />
            <span className="text-[10px] tracking-tight font-medium">History</span>
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
