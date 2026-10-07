'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap,
  ShieldCheck,
  Star,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  ArrowLeft,
  Navigation,
  Check,
  MapPin,
  Sparkles,
  AlertTriangle,
  Home,
  Calendar,
  Receipt,
  User,
  X,
  MessageSquare,
} from '@/components/ui/icons';
import { BrandLogo, BrandMark } from '@/components/ui/brand-logo';

interface ActiveJobTrack {
  id: string;
  jobTicketNumber: string;
  serviceTitle: string;
  status: string;
  priority: string;
  handoverOtp: string;
  totalAmountInr: number;
  customerAddressText: string;
  pincode: string;
  technician: {
    fullName: string;
    phone: string;
    badgeNumber: string;
    rating: number;
    experienceYears?: number;
    completedJobsCount?: number;
  };
}

export default function CustomerLiveTrackingPage() {
  const [job, setJob] = useState<ActiveJobTrack>({
    id: 'job_1001',
    jobTicketNumber: 'J-1001',
    serviceTitle: 'Ceiling Fan Installation & Wiring Check',
    status: 'EN_ROUTE',
    priority: 'STANDARD',
    handoverOtp: '4829',
    totalAmountInr: 1250.0,
    customerAddressText: 'Flat 402, Sea View Apartments, Colaba, Mumbai 400001',
    pincode: '400001',
    technician: {
      fullName: 'Rajesh Kumar',
      phone: '+919876543212',
      badgeNumber: 'TECH-4819',
      rating: 4.8,
      experienceYears: 7,
      completedJobsCount: 340,
    },
  });

  const [etaMinutes, setEtaMinutes] = useState(10);
  const [distanceKm, setDistanceKm] = useState('2.4');
  const [markerOffset, setMarkerOffset] = useState({ x: 0, y: 0 });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);

  // Animate GPS Marker along the route
  useEffect(() => {
    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % 4;
      if (step === 0) {
        setMarkerOffset({ x: 0, y: 0 });
        setEtaMinutes(10);
        setDistanceKm('2.4');
      } else if (step === 1) {
        setMarkerOffset({ x: 18, y: -14 });
        setEtaMinutes(9);
        setDistanceKm('2.1');
      } else if (step === 2) {
        setMarkerOffset({ x: 34, y: -28 });
        setEtaMinutes(8);
        setDistanceKm('1.7');
      } else {
        setMarkerOffset({ x: 50, y: -40 });
        setEtaMinutes(7);
        setDistanceKm('1.3');
      }
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  // Fetch real active job if available
  useEffect(() => {
    const fetchActiveJob = async () => {
      try {
        const res = await fetch('/api/customer/profile?customerId=cust_amit_01');
        const data = await res.json();
        if (data.success && data.data?.activeJob) {
          const apiJob = data.data.activeJob;
          setJob((prev) => ({
            ...prev,
            id: apiJob.id || prev.id,
            jobTicketNumber: apiJob.jobTicketNumber || prev.jobTicketNumber,
            serviceTitle: apiJob.serviceTitle || prev.serviceTitle,
            handoverOtp: apiJob.handoverOtp || prev.handoverOtp,
            totalAmountInr: apiJob.totalAmountInr || prev.totalAmountInr,
            customerAddressText: apiJob.customerAddressText || prev.customerAddressText,
            technician: {
              ...prev.technician,
              fullName: apiJob.technician?.fullName || prev.technician.fullName,
              phone: apiJob.technician?.phone || prev.technician.phone,
              rating: apiJob.technician?.rating || prev.technician.rating,
              badgeNumber: apiJob.technician?.badgeNumber || prev.technician.badgeNumber,
            },
          }));
        }
      } catch (err) {
        console.error('Failed to load tracking job', err);
      }
    };
    fetchActiveJob();
  }, []);

  const handleConfirmCancel = () => {
    setCancelFeedback('Service request cancellation request sent to partner dispatch desk.');
    setTimeout(() => {
      setShowCancelModal(false);
      setCancelFeedback(null);
    }, 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-white text-slate-900 pb-20 select-none">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/customer"
              className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <BrandMark size="xs" badgeBg="bg-blue-50 border border-blue-200 shadow-2xs" />
            <div className="min-w-0">
              <span className="font-extrabold text-sm text-slate-900 block truncate">
                Technician On The Way
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium truncate">
                <span>Job #{job.jobTicketNumber}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="text-blue-600 font-bold truncate">{job.serviceTitle}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 border border-orange-200 rounded-full shrink-0">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
            <span className="text-[10px] text-orange-700 font-extrabold uppercase tracking-wider">
              Live GPS
            </span>
          </div>
        </div>
      </header>

      {/* Interactive GPS Map Container */}
      <div className="relative w-full px-4 pt-3">
        <div className="relative w-full h-[260px] rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-slate-100">
          {/* Mumbai Map Graphic Canvas */}
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80')`,
              filter: 'contrast(1.05) brightness(1.02)',
            }}
          />
          <div className="absolute inset-0 bg-blue-900/10 pointer-events-none" />

          {/* SVG Route Trajectory Path */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" fill="none" viewBox="0 0 360 260">
            <path
              d="M 65 190 C 110 160, 160 145, 205 105 C 240 75, 275 70, 295 55"
              stroke="#0066ff"
              strokeDasharray="6 4"
              strokeLinecap="round"
              strokeWidth="4"
              className="opacity-90"
            />
            <path
              d="M 65 190 C 110 160, 160 145, 205 105 C 240 75, 275 70, 295 55"
              stroke="#ffffff"
              strokeLinecap="round"
              strokeOpacity="0.8"
              strokeWidth="1.5"
            />
          </svg>

          {/* Customer Destination Marker */}
          <div className="absolute top-[35px] right-[45px] flex flex-col items-center pointer-events-none">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-8 h-8 rounded-full bg-orange-500/30 animate-ping"></span>
              <div className="w-8 h-8 rounded-full bg-orange-600 shadow-md flex items-center justify-center text-white">
                <MapPin className="w-4 h-4 fill-current" />
              </div>
            </div>
            <div className="mt-1 px-2 py-0.5 rounded-full bg-slate-900/90 text-white shadow-xs text-[10px] font-bold whitespace-nowrap">
              Home (Colaba)
            </div>
          </div>

          {/* Live Technician Animated Marker */}
          <div
            className="absolute bottom-[48px] left-[45px] flex flex-col items-center transition-all duration-700 ease-out cursor-pointer"
            style={{
              transform: `translate(${markerOffset.x}px, ${markerOffset.y}px)`,
            }}
          >
            <div className="px-2.5 py-1 rounded-full bg-blue-600 text-white shadow-md flex items-center gap-1.5 text-[10px] font-bold mb-1 whitespace-nowrap">
              <Navigation className="w-3 h-3 fill-current" />
              <span>Rajesh • {etaMinutes} mins away</span>
            </div>
            <div className="relative flex items-center justify-center">
              <span className="absolute w-10 h-10 rounded-full bg-blue-500/25 animate-pulse"></span>
              <div className="w-9 h-9 rounded-full bg-blue-600 shadow-lg flex items-center justify-center text-white">
                <Zap className="w-4 h-4 fill-current" />
              </div>
            </div>
          </div>

          {/* Top Traffic Alert Pill */}
          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur shadow-xs flex items-center gap-1.5 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] text-slate-800 font-semibold">
              Moderate traffic on Cuffe Parade • Flowing
            </span>
          </div>

          {/* Map Controls */}
          <div className="absolute bottom-2.5 right-2.5 flex flex-col gap-1.5">
            <button
              onClick={() => setMarkerOffset({ x: 0, y: 0 })}
              className="w-8 h-8 rounded-lg bg-white/95 backdrop-blur shadow-xs text-slate-700 flex items-center justify-center active:scale-95 border border-slate-200 hover:bg-slate-50 transition-colors"
              title="Center on Technician"
            >
              <Navigation className="w-4 h-4 text-blue-600" />
            </button>
            <button
              onClick={() => setMarkerOffset({ x: 30, y: -25 })}
              className="w-8 h-8 rounded-lg bg-white/95 backdrop-blur shadow-xs text-slate-700 flex items-center justify-center active:scale-95 border border-slate-200 hover:bg-slate-50 transition-colors"
              title="Recenter Destination"
            >
              <MapPin className="w-4 h-4 text-orange-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Technician Profile & Contact Card */}
      <div className="px-4 mt-3 space-y-3">
        <div className="w-full bg-white rounded-2xl p-4 shadow-2xs border border-slate-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-13 h-13 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                  <span>RK</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-extrabold text-sm text-slate-900 truncate">
                    {job.technician.fullName}
                  </h2>
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[9px] font-bold border border-emerald-200 shrink-0">
                    Verified Pro
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate font-medium">
                  Master Electrician • {job.technician.experienceYears || 7}+ Yrs Exp
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                  <span className="text-xs font-bold text-slate-900">{job.technician.rating}</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    ({job.technician.completedJobsCount || 340} completed jobs)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`tel:${job.technician.phone}`}
                aria-label="Call Electrician"
                className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs active:scale-95 hover:bg-blue-700 transition-colors"
                title={`Call ${job.technician.fullName}`}
              >
                <Phone className="w-4 h-4 fill-current" />
              </a>
              <button
                aria-label="Message Electrician"
                onClick={() => alert(`Direct SMS channel opened with ${job.technician.fullName}`)}
                className="w-10 h-10 rounded-full bg-slate-100 text-blue-600 flex items-center justify-center shadow-xs active:scale-95 hover:bg-slate-200 transition-colors"
                title="Chat with Electrician"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ETA & Distance Telemetry Strip */}
          <div className="mt-3.5 pt-3 bg-slate-50 rounded-xl p-3 flex items-center justify-between border border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                  Estimated Arrival
                </span>
                <span className="text-xs font-extrabold text-slate-900">
                  10:45 AM <span className="font-normal text-slate-500">(in {etaMinutes} mins)</span>
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                Distance
              </span>
              <span className="text-xs font-extrabold text-blue-700 font-mono">{distanceKm} km</span>
            </div>
          </div>
        </div>

        {/* Live Milestone Progress Stepper */}
        <div className="w-full bg-white rounded-2xl p-4 shadow-2xs border border-slate-200">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <span className="font-bold text-xs text-slate-900">Live Job Progress</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              Step 2 of 4
            </span>
          </div>

          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-200"></div>

            {/* Step 1 */}
            <div className="relative flex items-start">
              <div className="absolute -left-6 mt-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Technician Assigned</span>
                  <span className="text-[10px] text-slate-400">10:25 AM</span>
                </div>
                <p className="text-[11px] text-slate-500">{job.technician.fullName} accepted service request</p>
              </div>
            </div>

            {/* Step 2 (Active) */}
            <div className="relative flex items-start">
              <div className="absolute -left-6 mt-0.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md ring-4 ring-blue-100">
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-blue-700">En Route to Location</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  Currently riding on Shahid Bhagat Singh Road
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex items-start opacity-60">
              <div className="absolute -left-6 mt-0.5 w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-700">Arrived at Doorstep</span>
                  <span className="text-[10px] text-slate-400">Pending</span>
                </div>
                <p className="text-[11px] text-slate-500">Verify 1000V safety kit and inspect wiring</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative flex items-start opacity-60">
              <div className="absolute -left-6 mt-0.5 w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-700">Installation & Handover</span>
                  <span className="text-[10px] text-slate-400">Est. 45m</span>
                </div>
                <p className="text-[11px] text-slate-500">Digital speed test & 4-digit handover OTP seal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Handover OTP Confidential Box */}
        <div className="w-full bg-amber-50 rounded-2xl p-4 shadow-2xs border border-amber-200">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span className="font-bold text-xs text-amber-950 uppercase tracking-wide">
                Start Service / Handover OTP
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold">
              Confidential
            </span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Share this 4-digit code with the technician <strong>only after</strong> he arrives at your
            doorstep and inspects the site safely.
          </p>

          <div className="flex items-center justify-center gap-3 my-3">
            {job.handoverOtp.split('').map((digit, idx) => (
              <div
                key={idx}
                className="w-12 h-14 rounded-xl bg-white border border-amber-300 text-slate-900 flex items-center justify-center font-mono font-extrabold text-2xl shadow-xs"
              >
                {digit}
              </div>
            ))}
          </div>
        </div>

        {/* Service Summary Card */}
        <div className="w-full bg-white rounded-2xl p-4 shadow-2xs border border-slate-200">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Service Order Summary
              </span>
              <h3 className="font-bold text-xs text-slate-900 mt-0.5 truncate">{job.serviceTitle}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{job.customerAddressText}</p>
            </div>
            <span className="font-mono font-extrabold text-sm text-blue-700 whitespace-nowrap">
              ₹{job.totalAmountInr.toFixed(0)}
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-700">
              <BrandMark size="xs" variant="default" badge={false} className="shrink-0" />
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[11px] font-bold">1 Year GTS ElectriCare Warranty</span>
            </div>
            <Link
              href="/customer/history"
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              View Receipt →
            </Link>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1 pb-4">
          <button
            type="button"
            onClick={() => alert(`Ticket #${job.jobTicketNumber} details confirmed with Maharashtra Ops Hub.`)}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 active:scale-[0.99] transition-all"
          >
            View Full Booking Details
          </button>
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="w-full py-3 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 font-bold text-xs transition-colors"
          >
            Cancel Service Request
          </button>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-[430px] bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4"></div>
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="font-bold text-sm text-slate-900">Cancel Electrical Request?</h4>
            </div>

            {cancelFeedback ? (
              <p className="text-xs text-emerald-700 font-medium py-3">{cancelFeedback}</p>
            ) : (
              <>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Technician {job.technician.fullName} is currently {distanceKm} km away. Cancelling now
                  may incur a convenience fee of ₹150 for field travel compensation.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
                  >
                    Keep Booking
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCancel}
                    className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs"
                  >
                    Confirm Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] tracking-tight font-medium">Bookings</span>
          </Link>
          <Link
            href="/customer/track"
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 text-blue-600 font-bold"
          >
            <Navigation className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Track</span>
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
