'use client';

import React, { useState, useEffect } from 'react';

export default function AdminCommissionsPage() {
  const [platformPct, setPlatformPct] = useState(15.0);
  const [partnerPct, setPartnerPct] = useState(15.0);
  const [techPct, setTechPct] = useState(70.0);
  const [gstRate, setGstRate] = useState(18.0);
  const [emergencyPremium, setEmergencyPremium] = useState(20.0);
  const [autoDisburse, setAutoDisburse] = useState(true);
  const [minThreshold, setMinThreshold] = useState(500);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live simulation bill amount
  const [simBaseAmount, setSimBaseAmount] = useState(1059.32);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/commissions');
      const json = await res.json();
      if (json.success && json.data) {
        setPlatformPct(json.data.platformRevenueSharePct);
        setPartnerPct(json.data.partnerDefaultSharePct);
        setTechPct(json.data.technicianNetSharePct);
        setGstRate(json.data.gstStatutoryRatePct);
        setEmergencyPremium(json.data.emergencySosPremiumPct);
        setAutoDisburse(json.data.autoEscrowDisbursement);
        setMinThreshold(json.data.minWithdrawalThresholdInr);
      }
    } catch {
      showToast('Error loading commission config');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const totalBaseShare = Math.round((platformPct + partnerPct + techPct) * 10) / 10;
  const isBalanced = Math.abs(totalBaseShare - 100.0) < 0.05;

  // Live simulation calculation
  const simGst = Math.round(simBaseAmount * (gstRate / 100) * 100) / 100;
  const simTotal = Math.round((simBaseAmount + simGst) * 100) / 100;
  const simPlatform = Math.round(simBaseAmount * (platformPct / 100) * 100) / 100;
  const simPartner = Math.round(simBaseAmount * (partnerPct / 100) * 100) / 100;
  const simTech = Math.round(simBaseAmount * (techPct / 100) * 100) / 100;
  const simDistributed = Math.round((simPlatform + simPartner + simTech + simGst) * 100) / 100;
  const simVariance = Math.round((simTotal - simDistributed) * 100) / 100;

  const handleSaveConfig = async () => {
    if (!isBalanced) {
      showToast(`Cannot save: Total split must equal 100.0% (Current: ${totalBaseShare}%)`);
      return;
    }

    try {
      const res = await fetch('/api/admin/commissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformRevenueSharePct: platformPct,
          partnerDefaultSharePct: partnerPct,
          technicianNetSharePct: techPct,
          gstStatutoryRatePct: gstRate,
          emergencySosPremiumPct: emergencyPremium,
          autoEscrowDisbursement: autoDisburse,
          minWithdrawalThresholdInr: minThreshold,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Global commission rules saved & applied across platform');
      } else {
        showToast(json.error || 'Failed to save configuration');
      }
    } catch {
      showToast('Network error saving commission config');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-blue-400 font-medium text-sm animate-bounce">
          <span>⚖️</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest bg-blue-50 text-blue-700 border border-blue-200 uppercase">
              ADM-SCR-13
            </span>
            <span className="text-xs text-slate-500 font-medium">Algorithmic Distribution Sliders</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Global Commission Configuration</h1>
          <p className="text-sm text-slate-500">
            Define multi-tenant revenue split between Ghar Tak Service Platform, Regional Franchises, and Field Technicians.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveConfig}
          disabled={!isBalanced}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg transition transform active:scale-95 ${
            isBalanced
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
          }`}
        >
          <span>💾</span>
          <span>Save Global Rules</span>
        </button>
      </div>

      {/* Mathematical Balance Interlock Warning */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition shadow-xs ${
          isBalanced
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{isBalanced ? '✓' : '⚠️'}</span>
          <div>
            <div className="text-sm font-bold">
              {isBalanced ? 'Mathematical Balance Verified (100.0%)' : 'Variance Detected in Labor Split!'}
            </div>
            <div className="text-xs opacity-90 mt-0.5">
              Platform ({platformPct}%) + Partner ({partnerPct}%) + Technician ({techPct}%) = {totalBaseShare}%
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono font-bold block">
            {isBalanced ? '100% Balanced' : `${Math.abs(totalBaseShare - 100).toFixed(1)}% Imbalance`}
          </span>
        </div>
      </div>

      {/* Main Grid: Rate Sliders & Live Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-xs hover:shadow-md transition-shadow">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <span>🎚️</span>
            <span>Base Labor Split Parameters</span>
          </h2>

          {/* Platform Share Slider */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-blue-700">Ghar Tak Service Platform Fee</span>
              <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {platformPct.toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="35"
              step="0.5"
              value={platformPct}
              onChange={(e) => setPlatformPct(Number(e.target.value))}
              className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="text-[11px] text-slate-500">
              National SaaS infrastructure, payment gateways, and algorithmic dispatch fee.
            </div>
          </div>

          {/* Partner Share Slider */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-purple-700">Franchise Partner Commission</span>
              <span className="font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                {partnerPct.toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="35"
              step="0.5"
              value={partnerPct}
              onChange={(e) => setPartnerPct(Number(e.target.value))}
              className="w-full accent-purple-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="text-[11px] text-slate-500">
              Regional operational oversight, fleet onboarding, and local territory management.
            </div>
          </div>

          {/* Technician Share Slider */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-emerald-700">Technician Net Take-Home</span>
              <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {techPct.toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="90"
              step="0.5"
              value={techPct}
              onChange={(e) => setTechPct(Number(e.target.value))}
              className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="text-[11px] text-slate-500">
              Direct field labor payout disbursed to technician digital wallet.
            </div>
          </div>

          {/* Statutory Tax & Priority Emergency Settings */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <label className="block text-[11px] font-bold text-amber-700 mb-1">
                Statutory GST Rate (%)
              </label>
              <input
                type="number"
                value={gstRate}
                disabled
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-mono opacity-80 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-500 block mt-1">Locked at 18.0% (CGST 9% + SGST 9%)</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <label className="block text-[11px] font-bold text-red-700 mb-1">
                24/7 Priority Emergency Surcharge (%)
              </label>
              <input
                type="number"
                value={emergencyPremium}
                onChange={(e) => setEmergencyPremium(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-mono outline-none focus:border-red-500"
              />
              <span className="text-[10px] text-slate-500 block mt-1">Applied on urgent SLA requests</span>
            </div>
          </div>
        </div>

        {/* Live Simulation Calculator Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>🧮</span>
                <span>Live Escrow Simulation Calculator</span>
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                REAL-TIME RECONCILIATION
              </span>
            </div>

            <div className="mt-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Test Work Order Base Labor Amount (₹ INR)
              </label>
              <input
                type="number"
                step="50"
                value={simBaseAmount}
                onChange={(e) => setSimBaseAmount(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold text-sm outline-none focus:border-blue-500"
              />
            </div>

            {/* Simulated Receipt Breakdown */}
            <div className="mt-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between text-slate-700">
                <span>Customer Base Labor</span>
                <span className="font-mono font-bold text-slate-900">₹{simBaseAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>Statutory 18% GST (CGST + SGST)</span>
                <span className="font-mono font-bold">₹{simGst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                <span>Total Customer Inflow</span>
                <span className="font-mono text-emerald-600 text-base">₹{simTotal.toFixed(2)}</span>
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-2 text-[11px]">
                <span className="text-slate-600 font-bold block">Automated Escrow Distribution:</span>
                <div className="flex justify-between text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Ghar Tak Service Platform Fee ({platformPct}%)</span>
                  </span>
                  <span className="font-mono text-blue-600 font-bold">₹{simPlatform.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>Partner Regional Franchise ({partnerPct}%)</span>
                  </span>
                  <span className="font-mono text-purple-600 font-bold">₹{simPartner.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Technician Net Take-Home ({techPct}%)</span>
                  </span>
                  <span className="font-mono text-emerald-600 font-bold">₹{simTech.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Government Tax Escrow Reserve ({gstRate}%)</span>
                  </span>
                  <span className="font-mono text-amber-600 font-bold">₹{simGst.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600">Reconciliation Variance:</span>
            <span
              className={`font-mono font-bold ${
                Math.abs(simVariance) < 0.05 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {Math.abs(simVariance) < 0.05 ? '✓ ₹0.00 (Zero Variance)' : `⚠️ ₹${simVariance} Discrepancy`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
