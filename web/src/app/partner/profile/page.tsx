'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface PartnerProfile {
  id: string;
  userId: string;
  entityName: string;
  directorName: string;
  email: string;
  phone: string;
  companyRegistrationNumber: string;
  gstin: string;
  stateLicensed: string;
  allocatedStates: string[];
  maxPincodeQuota: number;
  activePincodesCount: number;
  activeTechnicianQuota: number;
  activeTechnicianCount: number;
  platformRevenueSharePct: number;
  partnerRevenueSharePct: number;
  ifscCode: string;
  bankAccountNumber: string;
  bankName: string;
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED';
  createdAt: string;
}

export default function PartnerProfilePage() {
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'BUSINESS' | 'BANKING' | 'AREAS' | 'SECURITY'>('BUSINESS');
  const [saving, setSaving] = useState(false);

  // Form states
  const [directorName, setDirectorName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/partner/profile?partnerId=ptnr_mah_01');
      const data = await res.json();
      if (data.success && data.partner) {
        setPartner(data.partner);
        setDirectorName(data.partner.directorName || '');
        setEmail(data.partner.email || '');
        setPhone(data.partner.phone || '');
        setBankName(data.partner.bankName || '');
        setBankAccountNumber(data.partner.bankAccountNumber || '');
        setIfscCode(data.partner.ifscCode || '');
      }
    } catch (err) {
      console.error('Failed to load partner profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/partner/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: partner?.id || 'ptnr_mah_01',
          directorName,
          email,
          phone,
          bankName,
          bankAccountNumber,
          ifscCode,
          actorId: 'usr_partner_01',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          `Franchise profile & bank details saved successfully (WORM Block #${data.auditLog?.sequenceNumber})`
        );
        setPartner(data.partner);
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSaving(false);
    }
  };

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

      {/* Breadcrumb Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            <span>Operational Portal</span>
            <span>/</span>
            <span>Franchise Governance</span>
            <span>/</span>
            <span className="text-[#1B5E20]">Entity Profile &amp; Banking Settings (PTNR-SCR-17)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Partner Profile &amp; Operating Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Manage regional partner entity details, assigned service perimeters, commercial banking settlement accounts, and portal security.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#1B5E20] text-xs font-bold flex items-center gap-1.5">
            <span>🛡️</span>
            <span>Compliance Tier: L3 Enterprise Partner</span>
          </div>
        </div>
      </div>

      {/* Partner Summary Hero Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden relative">
        <div className="h-2 bg-gradient-to-r from-[#1B5E20] via-emerald-500 to-teal-600"></div>
        <div className="p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex items-start md:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1B5E20] to-emerald-500 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-md">
              MT
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-black text-slate-900">
                  {partner?.entityName || 'Maharashtra Tier-1 Operations Hub'}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#1B5E20] text-xs font-bold uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  Active Partner
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="font-mono font-bold text-slate-800">
                  ID: {partner?.id || 'ptnr_mah_01'}
                </span>
                <span>&bull;</span>
                <span>State: <strong className="text-slate-800 font-bold">Maharashtra</strong></span>
                <span>&bull;</span>
                <span>Region: <strong className="text-slate-800 font-bold">Mumbai Metro &amp; Pune Division</strong></span>
                <span>&bull;</span>
                <span className="text-[#1B5E20] font-bold">
                  📍 {partner?.activePincodesCount || 45} Pincodes Covered
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stat Badges */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">SLA Compliance</span>
              <span className="text-base font-black text-emerald-700">99.4%</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Active Crew</span>
              <span className="text-base font-black text-slate-900">
                {partner?.activeTechnicianCount || 48} Staff
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Contract Cycle</span>
              <span className="text-base font-black text-[#1B5E20]">2024-27</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="px-6 flex items-center gap-2 bg-slate-50 border-t border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('BUSINESS')}
            className={`py-3 px-4 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'BUSINESS'
                ? 'border-[#1B5E20] text-[#1B5E20]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🏢</span>
            <span>Business Details</span>
          </button>
          <button
            onClick={() => setActiveTab('BANKING')}
            className={`py-3 px-4 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'BANKING'
                ? 'border-[#1B5E20] text-[#1B5E20]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🏦</span>
            <span>Bank &amp; Settlement Details</span>
          </button>
          <button
            onClick={() => setActiveTab('AREAS')}
            className={`py-3 px-4 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'AREAS'
                ? 'border-[#1B5E20] text-[#1B5E20]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📍</span>
            <span>Service Areas &amp; Quotas</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
              {partner?.activePincodesCount || 45}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`py-3 px-4 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'SECURITY'
                ? 'border-[#1B5E20] text-[#1B5E20]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🔒</span>
            <span>Security &amp; Account</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT PANELS */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* TAB 1: Business Details */}
        {activeTab === 'BUSINESS' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">Legal Entity &amp; Representative</h3>
                  <p className="text-xs text-slate-500">Core franchise corporate details submitted for tax &amp; commercial compliance.</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-[#1B5E20] font-bold">
                  KYC Verified Q3
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Business Entity Name</label>
                  <input
                    type="text"
                    disabled
                    value={partner?.entityName || 'Maharashtra Tier-1 Operations Hub'}
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 cursor-not-allowed select-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Partner ID (System Assigned)</label>
                  <input
                    type="text"
                    disabled
                    value={partner?.id || 'ptnr_mah_01'}
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 cursor-not-allowed select-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Managing Director / Representative</label>
                  <input
                    type="text"
                    value={directorName}
                    onChange={(e) => setDirectorName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Registered Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Corporate CIN</label>
                  <input
                    type="text"
                    disabled
                    value={partner?.companyRegistrationNumber || 'CIN-MH-2024-88912'}
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-700 cursor-not-allowed select-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#1B5E20] hover:bg-[#0D3B0D] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Business Changes'}
                </button>
              </div>
            </div>

            {/* Side Card: Regulatory GSTIN */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 text-xs">
              <h4 className="font-black text-slate-900 text-sm">Regulatory GST &amp; Tax Status</h4>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">GSTIN Certificate</span>
                <span className="font-mono font-black text-[#1B5E20] text-sm">{partner?.gstin || '27AABCU9603R1ZM'}</span>
                <span className="text-[10px] text-slate-500 block">State: 27 (Maharashtra)</span>
              </div>
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 space-y-1">
                <span className="font-bold block">Tax Deducted at Source (TDS)</span>
                <p className="text-[11px] leading-relaxed">
                  Section 194C / 194M auto-split verified. Statutory 18% GST escrow reserve allocated for GSTR-3B filings.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Banking Settlement Details */}
        {activeTab === 'BANKING' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">Direct Settlement Bank Account</h3>
                  <p className="text-xs text-slate-500">Weekly escrow disbursement destination account for franchisee commission shares.</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-[#1B5E20] font-bold">
                  NEFT / RTGS Enabled
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bank Name &amp; Branch</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Bank Account Number</label>
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                <div>
                  <span className="font-bold block">Automated Weekly Escrow Payout Schedule</span>
                  <span className="text-[11px]">Disbursements processed every Wednesday at 02:00 IST via RBI NEFT batch.</span>
                </div>
                <span className="font-black text-sm">T+2 Days</span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#1B5E20] hover:bg-[#0D3B0D] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  {saving ? 'Writing to WORM Ledger...' : 'Save Settlement Bank Details 💾'}
                </button>
              </div>
            </div>

            {/* Side Card: Bank Verification Stamp */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 text-xs">
              <h4 className="font-black text-slate-900 text-sm">Banking Penny-Drop Verification</h4>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Account Status</span>
                <span className="font-bold text-emerald-700 text-xs flex items-center gap-1">
                  <span>✓</span> Penny-Drop Verified (HDFC)
                </span>
                <span className="text-[10px] text-slate-500 block">Name Match: 100% with Entity CIN</span>
              </div>
              <div className="text-[11px] text-slate-500 leading-relaxed">
                Changes to banking settlement credentials require WORM cryptographic audit log entry and platform compliance verification.
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Service Areas & Quotas */}
        {activeTab === 'AREAS' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Allocated Territory &amp; Operating Quotas</h3>
                <p className="text-xs text-slate-500">Government licensed state territory and assigned franchise quotas.</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-[#1B5E20] font-bold">
                Maharashtra State License
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Pincode Allocation Quota</span>
                <span className="text-2xl font-black text-slate-900">
                  {partner?.activePincodesCount || 45} / {partner?.maxPincodeQuota || 50}
                </span>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: '90%' }}></div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Active Technician Quota</span>
                <span className="text-2xl font-black text-slate-900">
                  {partner?.activeTechnicianCount || 48} / {partner?.activeTechnicianQuota || 100}
                </span>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: '48%' }}></div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Partner Revenue Share</span>
                <span className="text-2xl font-black text-[#1B5E20]">
                  {partner?.partnerRevenueSharePct || 15.0}% Net Base
                </span>
                <span className="text-[10px] text-slate-500 block mt-2">Platform Fee: 15.0%</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 block">Allocated State Jurisdictions</span>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold">
                  Maharashtra (All Zones)
                </span>
                <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold">
                  Mumbai Metro Hub (400001 - 400099)
                </span>
                <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold">
                  Pune Division (411001 - 411050)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Security & Compliance */}
        {activeTab === 'SECURITY' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Account Governance &amp; Security</h3>
                <p className="text-xs text-slate-500">Hardware 2FA authentication and WORM audit trail configuration.</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-[#1B5E20] font-bold">
                2FA Enforced
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block">Two-Factor Authentication (TOTP / SMS)</span>
                <p className="text-slate-500 text-[11px]">
                  All partner management logins require 6-digit OTP verification sent to +91 98765 43211.
                </p>
                <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-[#1B5E20] font-bold text-[10px]">
                  Active &bull; Security Level High
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block">WORM Audit Non-Repudiation</span>
                <p className="text-slate-500 text-[11px]">
                  All shift modifications, capacity adjustments, and ticket interventions are linked via SHA-256 blocks.
                </p>
                <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                  FIPS 180-4 Standard
                </span>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
