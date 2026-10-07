'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Navigation,
  Phone,
  MessageSquare,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Zap,
  Check,
  X,
  Info,
  DollarSign,
  Wrench,
} from '@/components/ui/icons';

function TechJobNavigationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('id') || 'J-1001';

  // Status & Telemetry State
  const [etaMinutes, setEtaMinutes] = useState<number>(10);
  const [distanceKm, setDistanceKm] = useState<number>(2.4);
  const [hasArrived, setHasArrived] = useState<boolean>(false);
  const [isVerifyingGeofence, setIsVerifyingGeofence] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Chat Drawer State
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'tech' | 'cust'; text: string; time: string }>>([
    { sender: 'cust', text: 'Hi Rajesh, are you nearby?', time: '09:35 AM' },
    { sender: 'tech', text: 'Yes Amit ji, I am turning onto Shahid Bhagat Singh Rd. 5-7 mins away.', time: '09:37 AM' },
    { sender: 'cust', text: 'Great, lift is working to 4th floor. Ring bell #402.', time: '09:38 AM' },
  ]);
  const [newChatText, setNewChatText] = useState<string>('');

  // SOS Emergency Modal State
  const [isSosModalOpen, setIsSosModalOpen] = useState<boolean>(false);

  // Dynamic ETA simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setEtaMinutes((prev) => (prev > 2 ? prev - 1 : 2));
      setDistanceKm((prev) => (prev > 0.4 ? Number((prev - 0.2).toFixed(1)) : 0.3));
    }, 45000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Arrival Handler (Geofence handshake simulation)
  const handleArrival = async () => {
    setIsVerifyingGeofence(true);
    showToast('📡 Geofence Verification: Pinging GPS coords (18.9220° N, 72.8347° E)...');

    setTimeout(() => {
      setIsVerifyingGeofence(false);
      setHasArrived(true);
      showToast('✓ Geofence Verified: You have arrived at Flat 402, Sea Green Apartments!');
    }, 1200);
  };

  // Send in-app chat message
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim()) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setChatMessages((prev) => [
      ...prev,
      { sender: 'tech', text: newChatText.trim(), time: timeStr },
    ]);
    setNewChatText('');
  };

  return (
    <div className="flex-1 flex flex-col bg-white text-slate-900 pb-28 select-none">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold backdrop-blur-md border border-slate-700 animate-in fade-in duration-200 max-w-[90vw]">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href="/tech"
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors shrink-0"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="font-bold text-sm tracking-tight text-slate-900 truncate">
                Live Job Navigation
              </h1>
              <p className="text-[10px] text-slate-500 font-mono">
                Order #{jobId} • Colaba 400001
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSosModalOpen(true)}
              className="px-2.5 py-1 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95 transition-all"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>SOS</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-800 font-bold text-xs">
              RK
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 space-y-4">
        {/* Status & Quick Overview Header */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-900 border border-orange-200">
              <span
                className={`w-2 h-2 rounded-full ${
                  hasArrived ? 'bg-emerald-600' : 'bg-orange-600 animate-pulse'
                }`}
              ></span>
              <span className="text-[11px] font-bold tracking-wider uppercase">
                {hasArrived ? 'Arrived at Site' : `En Route • ETA ${etaMinutes} Mins`}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">
              ID #{jobId}
            </span>
          </div>

          <div>
            <h2 className="font-extrabold text-lg text-slate-900 leading-tight">
              Ceiling Fan Installation &amp; Wiring
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[3]" />
                Standard Domestic Setup
              </span>
              <span>•</span>
              <span>1 Unit + Full Safety Inspection</span>
            </p>
          </div>
        </section>

        {/* Main Route Map Viewport */}
        <section className="rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-900 relative">
          {/* Simulated Interactive Stylized Map */}
          <div className="relative w-full h-56 bg-slate-800 overflow-hidden flex items-center justify-center">
            {/* SVG Roads & Grid Simulation */}
            <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#475569" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              {/* Major arterial roads */}
              <path d="M 20 220 C 100 180, 200 120, 320 60" stroke="#94a3b8" strokeWidth="12" fill="none" />
              <path d="M 120 220 C 180 160, 260 100, 380 40" stroke="#64748b" strokeWidth="8" fill="none" />
              {/* Route Polyline (Safety Orange) */}
              <path
                d="M 60 190 Q 180 140 280 80"
                stroke="#ea580c"
                strokeWidth="6"
                strokeDasharray="6,4"
                fill="none"
                className="animate-pulse"
              />
            </svg>

            {/* Start Pin (Technician Current GPS Marker) */}
            <div className="absolute left-14 bottom-12 flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-orange-600 text-white shadow-lg flex items-center justify-center border-2 border-white animate-bounce">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <span className="text-[10px] font-bold text-white bg-slate-900/90 px-1.5 py-0.2 rounded mt-1 shadow-xs">
                You (Rajesh)
              </span>
            </div>

            {/* Destination Pin (Customer Flat 402, Sea Green Apts) */}
            <div className="absolute right-16 top-10 flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white shadow-lg flex items-center justify-center border-2 border-white">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-white bg-slate-900/90 px-1.5 py-0.2 rounded mt-1 shadow-xs">
                Sea Green Apts
              </span>
            </div>

            {/* Live GPS Direction Ribbon Overlay */}
            <div className="absolute top-2.5 inset-x-2.5 p-2.5 rounded-xl bg-slate-900/95 backdrop-blur-md text-white flex items-center justify-between border border-slate-700 shadow-xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0">
                  <Navigation className="w-4 h-4 fill-current transform rotate-45" />
                </div>
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-white truncate">
                    In 250m turn right onto Shahid Bhagat Singh Rd
                  </p>
                  <p className="text-[10px] text-slate-300">Towards Sea Green Apartments, Colaba</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-black text-orange-400 font-mono">
                  {distanceKm} km
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Map Status Bar */}
          <div className="p-3.5 bg-white flex items-center justify-between border-t border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Distance &amp; Traffic Status
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="text-xs font-bold text-slate-800">
                  {distanceKm} km • Moderate Congestion (6m)
                </span>
              </div>
            </div>

            <a
              href="https://www.google.com/maps/dir/?api=1&destination=Sea+Green+Apartments+Colaba+Mumbai"
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Google Maps</span>
            </a>
          </div>
        </section>

        {/* Customer Destination Card */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-800 font-extrabold text-sm flex items-center justify-center shrink-0 border border-blue-200">
                AS
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-slate-900 truncate">Amit Sharma</h3>
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                </div>
                <p className="text-xs text-slate-500">Verified Resident • Flat 402</p>
              </div>
            </div>

            {/* Masked Touch-target Phone & Message actions */}
            <div className="flex items-center gap-2">
              <a
                href="tel:+919876543213"
                onClick={() => showToast('📞 Dialing customer Amit Sharma (+91 98765 43213)...')}
                aria-label="Call Customer"
                className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xs active:scale-90 transition-all"
              >
                <Phone className="w-4 h-4" />
              </a>
              <button
                onClick={() => setIsChatOpen(true)}
                aria-label="Chat with Customer"
                className="w-10 h-10 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center active:scale-90 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Address Detailed Box */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
            <MapPin className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Service Delivery Address
              </span>
              <p className="text-xs font-semibold text-slate-800 mt-0.5 leading-snug">
                Flat 402, 4th Floor, Sea Green Apartments, Shahid Bhagat Singh Rd, Colaba, Mumbai, Maharashtra 400001
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  🛗 Lift Operational to 4th Floor
                </span>
                <span className="text-[10px] text-slate-500">
                  Landmark: Near Colaba Post Office
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Payout & Job Financials Card */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Earnings &amp; Payout</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              UPI Prepaid (Escrow Secured)
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-orange-50 border border-orange-200">
            <div>
              <span className="text-[10px] font-bold text-orange-900 uppercase">
                Your Direct Take-Home Cut
              </span>
              <p className="text-2xl font-black text-orange-700 mt-0.5">₹1,000</p>
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                <Zap className="w-3 h-3" />
                Instant wallet credit on customer OTP sign-off
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Customer Total Bill
              </span>
              <p className="text-sm font-bold text-slate-700 line-through">₹1,250</p>
              <span className="text-[10px] text-slate-500">18% GST incl.</span>
            </div>
          </div>

          {/* Scope of Work Preview */}
          <div className="space-y-2 text-xs text-slate-700 pt-1">
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="flex items-center gap-1.5 font-medium">
                <Wrench className="w-3.5 h-3.5 text-orange-600" />
                Ceiling Fan Assembly &amp; Flush Mounting
              </span>
              <span className="font-bold text-slate-900">1 Unit</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="flex items-center gap-1.5 font-medium">
                <Zap className="w-3.5 h-3.5 text-orange-600" />
                Capacitor &amp; Phase Voltage Check (230V)
              </span>
              <span className="font-bold text-emerald-700">Included</span>
            </div>
          </div>
        </section>

        {/* Mandatory Safety Handshake Protocol Warning Banner */}
        <section className="bg-amber-50 rounded-2xl p-4 border border-amber-300 shadow-xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-xs text-amber-950 uppercase tracking-wide">
              Mandatory Field Handshake Protocol
            </h4>
            <p className="text-xs text-amber-900 mt-1 leading-normal">
              Do NOT begin physical dismantle or assembly without:
            </p>
            <ul className="text-xs text-amber-900 mt-1.5 space-y-1 list-disc list-inside font-medium">
              <li>
                Requesting customer&apos;s secret <strong>4-digit Handover OTP</strong>
              </li>
              <li>
                Inspecting safety kit &amp; donning <strong>1000V Insulated Gloves</strong>
              </li>
              <li>
                Verifying main circuit breaker isolation before touching junction box
              </li>
            </ul>
          </div>
        </section>

        {/* Customer Notes / Entry Instructions */}
        <section className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700">
            <strong className="text-slate-900">Customer Note: </strong>
            <span>&quot;Please ring bell #402. Spare fan box is kept in the balcony.&quot;</span>
          </div>
        </section>
      </main>

      {/* Sticky Bottom Arrival CTA Tray (Step 38: TECH-SCR-02) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 max-w-[430px] mx-auto shadow-xl">
        <div className="flex justify-between items-center px-1 mb-1.5 text-xs text-slate-500">
          <span className="flex items-center gap-1 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            GPS Geofence: 250m radius
          </span>
          <span className="font-bold text-orange-600">
            {hasArrived ? 'Status: Doorstep' : 'Colaba 400001'}
          </span>
        </div>

        {hasArrived ? (
          <div className="space-y-2">
            <div className="w-full h-13 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md">
              <CheckCircle2 className="w-5 h-5" />
              <span>Arrived at Doorstep! (Status: ARRIVED)</span>
            </div>
            <button
              onClick={() => {
                showToast('Proceeding to Step 39: Mandatory Safety Checklist...');
                router.push(`/tech/safety?id=${jobId}`);
              }}
              className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-colors"
            >
              Proceed to Safety Verification Checklist →
            </button>
          </div>
        ) : (
          <button
            id="arrival-btn"
            onClick={handleArrival}
            disabled={isVerifyingGeofence}
            className="w-full h-13 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all disabled:opacity-75"
          >
            {isVerifyingGeofence ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Verifying Geofence Location...</span>
              </>
            ) : (
              <>
                <MapPin className="w-5 h-5" />
                <span>I Have Arrived at Doorstep</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Customer Masked Chat Drawer */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-4 shadow-2xl border border-slate-200 flex flex-col h-[75vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                  AS
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Amit Sharma (Masked)</h3>
                  <span className="text-[10px] text-emerald-600 font-semibold">Online • Flat 402</span>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 text-xs">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${
                    msg.sender === 'tech' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-2.5 rounded-2xl ${
                      msg.sender === 'tech'
                        ? 'bg-orange-600 text-white rounded-br-xs'
                        : 'bg-slate-100 text-slate-900 rounded-bl-xs'
                    }`}
                  >
                    <p>{msg.text}</p>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="pt-2 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                placeholder="Type message to customer..."
                value={newChatText}
                onChange={(e) => setNewChatText(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SOS Emergency Modal */}
      {isSosModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-red-200 space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-extrabold text-base text-slate-900">
                Trigger Emergency SOS?
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                This alerts the Maharashtra Regional Dispatch Hub, contacts safety supervisors, and activates police/ambulance assistance if required.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  showToast('🚨 SOS ALERT BROADCASTED: Safety response unit dispatched to Colaba');
                  setIsSosModalOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
              >
                Yes, Transmit Emergency SOS
              </button>
              <button
                onClick={() => setIsSosModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TechJobNavigationPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading live navigation...</div>}>
      <TechJobNavigationContent />
    </React.Suspense>
  );
}
