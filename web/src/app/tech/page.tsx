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
  Phone,
  Navigation,
  Star,
  Wrench,
  HelpCircle,
  Activity,
  Check,
  Bell,
  Sliders,
  DollarSign,
  ChevronRight,
  TrendingUp,
  X,
  Info,
  AlertTriangle,
  ExternalLink,
} from '@/components/ui/icons';
import { BrandLogo, BrandMark } from '@/components/ui/brand-logo';

interface UrgentJob {
  id: string;
  ticketNumber: string;
  title: string;
  customerName: string;
  customerAddress: string;
  pincode: string;
  distanceKm: number;
  travelMinutes: number;
  techCutInr: number;
  totalInr: number;
  timerSeconds: number;
  customerPhone: string;
  instructions: string;
  scopeItems: string[];
}

export default function TechnicianDashboardPage() {
  const router = useRouter();

  // Duty Status (Online / Offline)
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Push Notification & Dispatch Modal States (Step 37: TASK-037)
  const [showInboundPush, setShowInboundPush] = useState<boolean>(true);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
  const [modalTimerSeconds, setModalTimerSeconds] = useState<number>(60);
  const [isDeclineDrawerOpen, setIsDeclineDrawerOpen] = useState<boolean>(false);
  const [selectedDeclineReason, setSelectedDeclineReason] = useState<string>('Traffic Congestion');

  // Urgent Job Offer State
  const [urgentJob, setUrgentJob] = useState<UrgentJob | null>({
    id: 'job_sample_urgent_01',
    ticketNumber: '#J-1005',
    title: 'Ceiling Fan Installation & Wiring',
    customerName: 'Amit Sharma',
    customerAddress: '34 Maker Chambers, Nariman Point, Colaba',
    pincode: '400001',
    distanceKm: 1.2,
    travelMinutes: 6,
    techCutInr: 1000,
    totalInr: 1250,
    timerSeconds: 60,
    customerPhone: '+919876543213',
    instructions: 'Please ring bell #402. Spare fan box is kept in the balcony.',
    scopeItems: [
      'Ceiling Fan Assembly & Flush Mounting',
      'Phase/Neutral Insulation Test (230V)',
      '1000V Insulated Gloves Protocol Mandatory',
    ],
  });
  const [isAccepting, setIsAccepting] = useState<boolean>(false);
  const [isAccepted, setIsAccepted] = useState<boolean>(false);

  // Active Field Queue
  const [activeQueue, setActiveQueue] = useState([
    {
      id: 'job_active_1001',
      ticketNumber: '#J-1001',
      title: 'MCB Continuous Tripping Fix',
      customerName: 'Vikram Mehta',
      address: 'Flat 402, Sea Green Apartments, Colaba',
      phase: 'Single Phase 220V',
      otpMasked: '****48',
      amountInr: 1850,
      status: 'En Route',
      phone: '+919876543213',
    },
    {
      id: 'job_active_1003',
      ticketNumber: '#J-1003',
      title: 'Chandelier Unboxing & Fixture Mounting',
      customerName: 'Pooja Singhania',
      address: 'Bandra West, Mumbai',
      phase: '3-Phase Heavy Fixture',
      timeSlot: '2:00 PM',
      duration: '1.5 hrs',
      amountInr: 2500,
      status: 'Scheduled',
      isPrepaid: true,
      phone: '+919876543214',
    },
  ]);

  // Daily Dispatch Metrics
  const [dailyStats, setDailyStats] = useState({
    todayEarnings: 2150,
    yesterdayEarnings: 1820,
    mtdEarnings: 32500,
    completedTasks: 2,
    inRouteTasks: 1,
    upcomingTasks: 1,
    totalScheduled: 4,
  });

  // Selected Assigned Pincode filter
  const [selectedPincode, setSelectedPincode] = useState<string>('400001');

  // Active Toolkit Modal / Drawer
  const [activeToolModal, setActiveToolModal] = useState<
    'wire-calc' | 'load-chart' | 'spares-box' | 'emergency-sos' | null
  >(null);

  // Wire Calculator inputs
  const [calcWatts, setCalcWatts] = useState<number>(2000);
  const [calcVolts, setCalcVolts] = useState<number>(230);

  // 60-Second Acceptance Countdown Timer (Step 37: TASK-037)
  useEffect(() => {
    if (!isDispatchModalOpen || modalTimerSeconds <= 0 || isAccepted) return;
    const timer = setInterval(() => {
      setModalTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsDispatchModalOpen(false);
          showToast('⚠️ Priority Job #J-1005 acceptance window expired. Reassigned to standby fleet.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isDispatchModalOpen, modalTimerSeconds, isAccepted]);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Toggle Online/Offline Status Handler
  const handleToggleDuty = async () => {
    const nextStatus = !isOnline;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch('/api/technicians/tech_rajesh_01/availability', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isOnline: nextStatus,
          latitude: 18.922,
          longitude: 72.8347,
        }),
      });
      if (res.ok) {
        setIsOnline(nextStatus);
        showToast(
          nextStatus
            ? '✓ Status: ONLINE. Ready to receive dispatch calls.'
            : '✓ Status: OFFLINE. Duty ended for the shift.'
        );
      } else {
        setIsOnline(nextStatus);
        showToast(`Status updated to ${nextStatus ? 'ONLINE' : 'OFFLINE'}`);
      }
    } catch {
      setIsOnline(nextStatus);
      showToast(`Status switched to ${nextStatus ? 'ONLINE' : 'OFFLINE'}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Accept Urgent Job Handler (Step 37: TASK-037)
  const handleAcceptJob = async () => {
    if (!urgentJob) return;
    setIsAccepting(true);
    try {
      await fetch('/api/jobs/job_sample_urgent_01/dispatch-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: 'tech_rajesh_01',
          action: 'ACCEPT',
        }),
      });
    } catch (err) {
      console.warn('Simulated dispatch fallback:', err);
    }

    setIsAccepted(true);
    showToast('🎉 Priority Job #J-1005 Accepted! Launching Turn-by-Turn GPS...');
    setTimeout(() => {
      setIsDispatchModalOpen(false);
      router.push('/tech/job?id=J-1005');
    }, 1200);
    setIsAccepting(false);
  };

  // Decline Urgent Job Handler (Step 37: TASK-037)
  const handleDeclineJob = async () => {
    try {
      await fetch('/api/jobs/job_sample_urgent_01/dispatch-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: 'tech_rajesh_01',
          action: 'REJECT',
          rejectionReason: selectedDeclineReason,
        }),
      });
    } catch (err) {
      console.warn('Decline response logged:', err);
    }

    setIsDeclineDrawerOpen(false);
    setIsDispatchModalOpen(false);
    setShowInboundPush(false);
    setUrgentJob(null);
    showToast(`✓ Job #J-1005 Declined (${selectedDeclineReason}). Reassigning to standby fleet.`);
  };

  // Trigger Inbound Push Simulation
  const triggerInboundPush = () => {
    setModalTimerSeconds(60);
    setShowInboundPush(true);
    setIsDispatchModalOpen(true);
    showToast('⚡ Inbound Push Alert Simulated: New Priority Job in Colaba');
  };

  // Format Timer String (mm:ss)
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="flex-1 flex flex-col bg-white text-slate-900 pb-20 select-none">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold backdrop-blur-md border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200 max-w-[90vw]">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Inbound Push Notification Banner (Step 37: TASK-037) */}
      {showInboundPush && urgentJob && !isAccepted && (
        <div className="sticky top-14 z-40 mx-3 my-2 animate-in slide-in-from-top-3 duration-300">
          <div
            onClick={() => setIsDispatchModalOpen(true)}
            className="cursor-pointer bg-slate-900 text-white rounded-2xl p-3 shadow-xl border border-orange-500/80 flex items-center justify-between gap-3 hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 animate-bounce">
                <Bell className="w-4 h-4 fill-current" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-orange-500 text-white">
                    Priority Push
                  </span>
                  <span className="text-xs font-mono text-orange-300 font-bold">
                    {formatTimer(modalTimerSeconds)}
                  </span>
                </div>
                <p className="text-xs font-bold text-white truncate mt-0.5">
                  {urgentJob.title} • {urgentJob.customerName}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  Colaba • 1.2 km away • Tech Cut ₹{urgentJob.techCutInr}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDispatchModalOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs"
              >
                View
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowInboundPush(false);
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BrandMark size="sm" badgeBg="bg-orange-50 border border-orange-200 shadow-2xs" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[15px] tracking-tight text-slate-900">
                  GTS Tech Pro
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200/60">
                  ElectriCare
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                ></span>
                <span className={isOnline ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                  {isOnline ? 'Online • Ready for Calls' : 'Offline • Duty Paused'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={triggerInboundPush}
              title="Simulate Inbound Push Notification"
              className="px-2 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 text-[10px] font-bold flex items-center gap-1 transition-colors"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Simulate Push</span>
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 p-0.5 shadow-xs">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                <span className="font-bold text-xs text-orange-700">RK</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Scrollable Area */}
      <main className="p-4 space-y-4">
        {/* Profile & Live Duty Toggle Card */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-12 h-12 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
                <span className="text-base font-bold text-orange-800">RK</span>
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-bold text-[16px] text-slate-900 truncate">Rajesh Kumar</h1>
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold tracking-wide">
                    PRO
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <div className="flex items-center text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-bold text-slate-900 ml-1">4.8</span>
                  </div>
                  <span>•</span>
                  <span>340 jobs done</span>
                  <span>•</span>
                  <span className="text-slate-400">TECH-4819</span>
                </div>
              </div>
            </div>

            {/* Online Toggle Switch Component */}
            <div className="flex flex-col items-end">
              <button
                id="duty-toggle-btn"
                onClick={handleToggleDuty}
                disabled={isUpdatingStatus}
                aria-label="Toggle Online Duty Status"
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 focus:outline-hidden p-1 shadow-xs ${
                  isOnline ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-200 flex items-center justify-center ${
                    isOnline ? 'translate-x-6' : 'translate-x-0'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOnline ? 'bg-emerald-600' : 'bg-slate-400'
                    }`}
                  ></span>
                </span>
              </button>
              <span
                className={`text-[10px] font-bold tracking-wider mt-1 uppercase ${
                  isOnline ? 'text-emerald-700' : 'text-slate-500'
                }`}
              >
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>

          {/* Assigned Pincodes Quick Tag Ribbon */}
          <div className="bg-slate-50 rounded-xl p-2.5 flex items-center gap-2 border border-slate-100">
            <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
              <button
                onClick={() => setSelectedPincode('400001')}
                className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                  selectedPincode === '400001'
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Colaba 400001 (Primary)
              </button>
              <button
                onClick={() => setSelectedPincode('400002')}
                className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                  selectedPincode === '400002'
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Fort 400002
              </button>
              <button
                onClick={() => setSelectedPincode('400050')}
                className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                  selectedPincode === '400050'
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Bandra 400050/51
              </button>
            </div>
          </div>
        </section>

        {/* Mandatory Safety Reminder Banner */}
        <section className="bg-gradient-to-r from-orange-50 via-amber-50 to-white rounded-2xl p-3.5 border border-orange-200/80 shadow-xs flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-orange-900 uppercase tracking-wider">
                Mandatory Field Protocol
              </p>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Kit Verified ✓
              </span>
            </div>
            <p className="text-xs text-slate-700 mt-0.5 leading-snug">
              Wear <strong>1000V Insulated gloves</strong> & calibrate digital voltage tester before
              touching residential panels.
            </p>
          </div>
        </section>

        {/* Operational Metric Overview */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Today&apos;s Earnings
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                +18%
              </span>
            </div>
            <div className="my-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                ₹{dailyStats.todayEarnings.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center gap-1 text-emerald-700 text-[11px] font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>vs ₹{dailyStats.yesterdayEarnings.toLocaleString('en-IN')} y&apos;day</span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Month to Date
              </span>
              <DollarSign className="w-4 h-4 text-orange-600" />
            </div>
            <div className="my-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                ₹{dailyStats.mtdEarnings.toLocaleString('en-IN')}
              </span>
            </div>
            <Link
              href="/tech/earnings"
              className="w-full py-1 text-center bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 text-xs font-bold rounded-lg transition-colors block"
            >
              Withdraw Now →
            </Link>
          </div>
        </section>

        {/* Daily Dispatch Tasks Progress Metric */}
        <section className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[14px] text-slate-900">Daily Dispatch Tasks</span>
              <span className="text-slate-500 text-xs">
                ({dailyStats.totalScheduled} Scheduled)
              </span>
            </div>
            <span className="text-xs font-bold text-orange-600">50% Complete</span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-100 flex overflow-hidden gap-0.5">
            <div className="bg-emerald-500 h-full w-1/4" title="Completed"></div>
            <div className="bg-emerald-500 h-full w-1/4" title="Completed"></div>
            <div className="bg-orange-500 h-full w-1/4 animate-pulse" title="In Progress"></div>
            <div className="bg-slate-300 h-full w-1/4 opacity-60" title="Pending"></div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2.5 text-center">
            <div className="bg-slate-50 py-1.5 rounded-lg border border-slate-100">
              <span className="block font-bold text-sm text-emerald-700">
                {dailyStats.completedTasks}
              </span>
              <span className="block text-[10px] text-slate-500 font-medium">Completed</span>
            </div>
            <div className="bg-slate-50 py-1.5 rounded-lg border border-slate-100">
              <span className="block font-bold text-sm text-orange-600">
                {dailyStats.inRouteTasks}
              </span>
              <span className="block text-[10px] text-slate-500 font-medium">In Route</span>
            </div>
            <div className="bg-slate-50 py-1.5 rounded-lg border border-slate-100">
              <span className="block font-bold text-sm text-slate-700">
                {dailyStats.upcomingTasks}
              </span>
              <span className="block text-[10px] text-slate-500 font-medium">Upcoming</span>
            </div>
          </div>
        </section>

        {/* Priority Request Card (Step 37: TASK-037) */}
        {urgentJob && (
          <section className="relative bg-white rounded-2xl shadow-md overflow-hidden border-2 border-orange-500 transition-all duration-300 animate-in fade-in">
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-3.5 py-1.5 flex items-center justify-between text-white">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                <span className="text-[11px] tracking-wider uppercase font-bold">
                  New Priority Request
                </span>
              </div>
              <div className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-full text-white text-[11px] font-mono font-bold">
                <Clock className="w-3 h-3" />
                <span id="countdown-timer">{formatTimer(modalTimerSeconds)}</span>
              </div>
            </div>

            <div className="p-3.5 flex flex-col space-y-3">
              <div className="flex justify-between items-start">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500">
                      {urgentJob.ticketNumber}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold">
                      Immediate (SLA 30m)
                    </span>
                  </div>
                  <h2 className="font-bold text-[15px] text-slate-900 mt-1">
                    {urgentJob.title}
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Customer: <strong className="text-slate-900">{urgentJob.customerName}</strong>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Technician Cut
                  </span>
                  <span className="text-xl font-black text-orange-600">
                    ₹{urgentJob.techCutInr.toLocaleString('en-IN')}
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    Total ₹{urgentJob.totalInr}
                  </span>
                </div>
              </div>

              {/* Distance and Location Map Indicator */}
              <div
                onClick={() => setIsDispatchModalOpen(true)}
                className="cursor-pointer flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Navigation className="w-4 h-4 text-orange-600 shrink-0" />
                  <div className="truncate">
                    <span className="block text-xs text-slate-900 font-semibold truncate">
                      {urgentJob.customerAddress}
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      {urgentJob.pincode} • {urgentJob.distanceKm} km away (
                      {urgentJob.travelMinutes} mins travel)
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>

              {/* Action Button Group & Quick Decline Reason Ribbon */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    id="decline-job-btn"
                    onClick={handleDeclineJob}
                    disabled={isAccepting || isAccepted}
                    className="h-11 col-span-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center active:scale-95 disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    id="accept-job-btn"
                    onClick={handleAcceptJob}
                    disabled={isAccepting || isAccepted}
                    className={`h-11 col-span-2 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                      isAccepted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                    }`}
                  >
                    {isAccepted ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Dispatched!
                      </>
                    ) : isAccepting ? (
                      'Processing...'
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Accept Job (₹1,000)
                      </>
                    )}
                  </button>
                </div>

                {/* Decline Reasons Selector Ribbon */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Decline Reason Category:
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
                    {['Traffic Congestion', 'Missing Spares', 'Vehicle Breakdown', 'Shift Ending'].map((reason) => (
                      <button
                        key={reason}
                        onClick={() => setSelectedDeclineReason(reason)}
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${
                          selectedDeclineReason === reason
                            ? 'bg-red-600 text-white shadow-2xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Live Dispatch Queue Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[14px] text-slate-900">Active Field Queue</h3>
            <span className="text-xs font-bold text-orange-600 hover:underline cursor-pointer">
              {activeQueue.length} Active Orders
            </span>
          </div>

          {activeQueue.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                      job.status === 'En Route'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {job.status === 'En Route' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-ping"></span>
                    )}
                    • {job.status}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {job.ticketNumber}
                  </span>
                </div>
                <span className="font-bold text-sm text-slate-900">
                  ₹{job.amountInr.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 text-orange-600">
                  <Wrench className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-slate-900 truncate">{job.title}</h4>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{job.address}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-700 text-[10px] font-semibold">
                      {job.phase}
                    </span>
                    {job.otpMasked && (
                      <span className="text-emerald-700 text-[10px] font-semibold bg-emerald-50 px-1 py-0.2 rounded border border-emerald-100">
                        OTP: {job.otpMasked}
                      </span>
                    )}
                    {job.isPrepaid && (
                      <span className="text-emerald-700 text-[10px] font-semibold bg-emerald-50 px-1 py-0.2 rounded border border-emerald-100">
                        Prepaid ✓
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Navigation Row with Direct Link to Step 38 */}
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={`tel:${job.phone}`}
                  aria-label="Call Customer"
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                </a>
                <Link
                  href={`/tech/job?id=${job.ticketNumber.replace('#', '')}`}
                  className="flex-1 h-10 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  Resume Turn-by-Turn
                </Link>
              </div>
            </div>
          ))}
        </section>

        {/* Quick Field Utilities Grid */}
        <section className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Field Toolkit &amp; Safety Utilities
            </span>
            <span className="text-[10px] font-semibold text-slate-400">Quick Calculators</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setActiveToolModal('wire-calc')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-orange-50 border border-slate-100 hover:border-orange-200 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center mb-1">
                <Sliders className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800">Wire Calc</span>
            </button>
            <button
              onClick={() => setActiveToolModal('load-chart')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-100 hover:border-amber-200 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-1">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800">Load Chart</span>
            </button>
            <button
              onClick={() => setActiveToolModal('spares-box')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-1">
                <Wrench className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800">Spares Box</span>
            </button>
            <button
              onClick={() => setActiveToolModal('emergency-sos')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center mb-1">
                <AlertCircle className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-red-700">SOS Alert</span>
            </button>
          </div>
        </section>
      </main>

      {/* FULL DISPATCH MODAL OVERLAY (Step 37: TASK-037) */}
      {isDispatchModalOpen && urgentJob && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Emergency Top Bar with 60s Countdown Timer */}
            <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-orange-100">
                    Incoming Priority Dispatch
                  </span>
                  <h3 className="font-bold text-sm tracking-tight">Work Order {urgentJob.ticketNumber}</h3>
                </div>
              </div>

              {/* 60s Acceptance Timer Pill */}
              <div className="flex items-center gap-1.5 bg-black/25 px-3 py-1.5 rounded-full border border-white/20">
                <Clock className="w-4 h-4 text-orange-200 animate-spin" />
                <span className="text-sm font-mono font-bold tracking-wider">
                  {formatTimer(modalTimerSeconds)}
                </span>
              </div>
            </div>

            {/* Countdown Progress Bar */}
            <div className="w-full h-1.5 bg-orange-200 overflow-hidden">
              <div
                className="h-full bg-orange-600 transition-all duration-1000 ease-linear"
                style={{ width: `${(modalTimerSeconds / 60) * 100}%` }}
              ></div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* Job Summary Banner */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold">
                    Domestic Electrical • SLA 30 Min
                  </span>
                  <h4 className="font-extrabold text-lg text-slate-900 mt-1">
                    {urgentJob.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Customer: <strong className="text-slate-900">{urgentJob.customerName}</strong>
                  </p>
                </div>
                <div className="text-right shrink-0 bg-orange-50 px-3 py-2 rounded-xl border border-orange-200">
                  <span className="block text-[10px] font-bold text-orange-800 uppercase">
                    Your Payout
                  </span>
                  <span className="text-2xl font-black text-orange-700">
                    ₹{urgentJob.techCutInr}
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    Gross ₹{urgentJob.totalInr} (Paid)
                  </span>
                </div>
              </div>

              {/* Location & Navigation Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-xs text-slate-900">
                      {urgentJob.customerAddress}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pincode {urgentJob.pincode} • <strong>{urgentJob.distanceKm} km away</strong> (approx. {urgentJob.travelMinutes} mins travel)
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Notes */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <span className="font-bold">Customer Entry Note: </span>
                  <span>&quot;{urgentJob.instructions}&quot;</span>
                </div>
              </div>

              {/* Scope Checklist */}
              <div className="space-y-1.5 text-xs text-slate-700">
                <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                  Service Execution Scope:
                </span>
                {urgentJob.scopeItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Decline Reason Drawer Toggle if requested */}
              {isDeclineDrawerOpen && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 space-y-2 animate-in fade-in">
                  <span className="block text-xs font-bold text-red-900">
                    Select Reason for Declining Job:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {[
                      'Traffic Congestion',
                      'Missing Spares',
                      'Vehicle Breakdown',
                      'Shift Ending',
                    ].map((reason) => (
                      <button
                        key={reason}
                        onClick={() => setSelectedDeclineReason(reason)}
                        className={`p-2 rounded-lg text-left font-semibold transition-colors ${
                          selectedDeclineReason === reason
                            ? 'bg-red-600 text-white'
                            : 'bg-white text-slate-700 border border-red-200'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setIsDeclineDrawerOpen(false)}
                      className="flex-1 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeclineJob}
                      className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                    >
                      Confirm Decline
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Action Buttons Footer */}
            {!isDeclineDrawerOpen && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-3 gap-2.5">
                <button
                  onClick={() => setIsDeclineDrawerOpen(true)}
                  className="h-12 col-span-1 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center justify-center active:scale-95"
                >
                  Decline
                </button>
                <button
                  onClick={handleAcceptJob}
                  disabled={isAccepting || isAccepted}
                  className={`h-12 col-span-2 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 ${
                    isAccepted
                      ? 'bg-emerald-600'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {isAccepted ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Job Accepted! Routing...</span>
                    </>
                  ) : isAccepting ? (
                    'Processing...'
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Accept Job (Earn ₹1,000)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toolkit Modal Drawers */}
      {activeToolModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {activeToolModal === 'wire-calc' && '⚡ Wire Gauge & Current Calculator'}
                {activeToolModal === 'load-chart' && '📊 Electrical Load Reference Table'}
                {activeToolModal === 'spares-box' && '🧰 Van Spares Inventory & Stocks'}
                {activeToolModal === 'emergency-sos' && '🚨 Emergency Dispatch Escalation'}
              </h3>
              <button
                onClick={() => setActiveToolModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4">
              {activeToolModal === 'wire-calc' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Appliance Load (Watts):
                    </label>
                    <input
                      type="number"
                      value={calcWatts}
                      onChange={(e) => setCalcWatts(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Operating Voltage (Volts AC):
                    </label>
                    <input
                      type="number"
                      value={calcVolts}
                      onChange={(e) => setCalcVolts(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
                    />
                  </div>
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600">Calculated Current:</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {(calcWatts / calcVolts).toFixed(2)} Amps
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-1">
                      <span className="text-slate-600">Recommended Copper Wire:</span>
                      <span className="font-bold text-orange-700">
                        {calcWatts / calcVolts > 16
                          ? '4.0 sq.mm (Heavy/AC)'
                          : calcWatts / calcVolts > 10
                          ? '2.5 sq.mm (Power Socket)'
                          : '1.5 sq.mm (Lighting/Fan)'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeToolModal === 'load-chart' && (
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-3 font-bold text-slate-600 bg-slate-100 p-2 rounded-lg">
                    <span>Appliance</span>
                    <span>Typical Load</span>
                    <span>MCB Rating</span>
                  </div>
                  <div className="grid grid-cols-3 p-2 border-b border-slate-100">
                    <span>Ceiling Fan</span>
                    <span>75 Watts</span>
                    <span>6A Type-C</span>
                  </div>
                  <div className="grid grid-cols-3 p-2 border-b border-slate-100">
                    <span>1.5 Ton Inverter AC</span>
                    <span>1,800 Watts</span>
                    <span>16A Type-C</span>
                  </div>
                  <div className="grid grid-cols-3 p-2 border-b border-slate-100">
                    <span>Geyser (Water Heater)</span>
                    <span>2,000 Watts</span>
                    <span>16A Type-C</span>
                  </div>
                  <div className="grid grid-cols-3 p-2">
                    <span>Induction Cooktop</span>
                    <span>2,200 Watts</span>
                    <span>20A Type-C</span>
                  </div>
                </div>
              )}

              {activeToolModal === 'spares-box' && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-800">16A Schneider MCB Single Pole</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                      4 In Stock
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-800">Anchor Roma 16A Modular Socket</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                      6 In Stock
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-800">Finolex 2.5 sq.mm FR Wire Coil (15m)</span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                      1 Left
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-800">1000V Certified Insulation Tape</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                      8 Rolls
                    </span>
                  </div>
                </div>
              )}

              {activeToolModal === 'emergency-sos' && (
                <div className="space-y-3">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs">
                    <p className="font-bold">⚠️ High Voltage / Flash Hazard Protocol</p>
                    <p className="mt-1">
                      Pressing the button below dispatches urgent safety personnel and contacts
                      MSEDCL grid disconnect emergency desk.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      showToast('🚨 SOS Emergency broadcasted to Partner Hub & Safety Ops Desk');
                      setActiveToolModal(null);
                    }}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-md transition-colors"
                  >
                    Transmit Immediate SOS (Colaba 400001)
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setActiveToolModal(null)}
                className="w-full py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Technician Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 max-w-[430px] mx-auto">
        <div className="flex items-center justify-around h-15 px-2">
          <Link
            href="/tech"
            className="flex flex-col items-center justify-center flex-1 py-1 text-orange-600 font-bold text-[11px]"
          >
            <div className="w-5 h-5 flex items-center justify-center mb-0.5">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <span>Home</span>
          </Link>

          <Link
            href="/tech/job"
            className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-slate-800 text-[11px] font-medium"
          >
            <div className="w-5 h-5 flex items-center justify-center mb-0.5">
              <Wrench className="w-4 h-4" />
            </div>
            <span>Jobs</span>
          </Link>

          <Link
            href="/tech/earnings"
            className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-slate-800 text-[11px] font-medium transition-colors"
          >
            <div className="w-5 h-5 flex items-center justify-center mb-0.5">
              <DollarSign className="w-4 h-4" />
            </div>
            <span>Earnings</span>
          </Link>

          <button
            onClick={() =>
              showToast(
                `Rajesh Kumar • Badge TECH-4819 • Grade-A Wireman License EL-MH-2024-8849`
              )
            }
            className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-slate-800 text-[11px] font-medium"
          >
            <div className="w-5 h-5 flex items-center justify-center mb-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span>Profile</span>
          </button>

          <button
            onClick={() =>
              showToast(
                `Partner Support Hotline: 1800-ELECTRI (Toll Free) • Colaba Hub Dispatch Desk`
              )
            }
            className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-slate-800 text-[11px] font-medium"
          >
            <div className="w-5 h-5 flex items-center justify-center mb-0.5">
              <HelpCircle className="w-4 h-4" />
            </div>
            <span>Help</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
