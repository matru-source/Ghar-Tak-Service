const fs = require('fs');
const path = require('path');

const rootDir = 'D:\\ZEX\\Ghar tak\\Assets\\figma';
const exportDir = path.join(rootDir, 'FIGMA_CLIENT_EXPORT');

// Clean existing export
fs.rmSync(exportDir, { recursive: true, force: true });
fs.mkdirSync(exportDir, { recursive: true });

const folders = {
  admin: path.join(exportDir, '01_ADMIN_OWNER_CRM'),
  partnerCrm: path.join(exportDir, '02_PARTNER_WEB_CRM'),
  partnerApp: path.join(exportDir, '03_PARTNER_MOBILE_APP'),
  techApp: path.join(exportDir, '04_TECHNICIAN_MOBILE_APP'),
  custApp: path.join(exportDir, '05_CUSTOMER_MOBILE_APP'),
  sys: path.join(exportDir, '06_COMMON_DESIGN_SYSTEM')
};

Object.values(folders).forEach(f => fs.mkdirSync(f, { recursive: true }));

// Carefully defined, logically sequenced screen definitions
const screens = [
  // ==========================================
  // 1. ADMIN / OWNER CRM (22 Screens)
  // ==========================================
  {
    screenId: 'ADM-01',
    role: 'Admin / Owner CRM',
    category: 'Dashboard & Analytics',
    screenName: 'Platform Overview & KPI Executive Dashboard',
    fileName: 'admin_web_crm_platform_dashboard.png',
    folder: folders.admin,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/admin_web_crm_platform_dashboard.png'
  },
  {
    screenId: 'ADM-02',
    role: 'Admin / Owner CRM',
    category: 'Finance & Tariffs',
    screenName: 'Enterprise Finance & Partner Settlement Overview',
    fileName: 'admin_web_crm_finance_commission_overview.png',
    folder: folders.admin,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/admin_web_crm_finance_commission_overview.png'
  },
  {
    screenId: 'ADM-03',
    role: 'Admin / Owner CRM',
    category: 'Finance & Tariffs',
    screenName: 'Global 70/15/15 Commission & Tariff Configuration',
    fileName: 'admin_web_crm_commission_configuration.png',
    folder: folders.admin,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/admin_web_crm_commission_configuration.png'
  },
  {
    screenId: 'ADM-04',
    role: 'Admin / Owner CRM',
    category: 'Finance & Tariffs',
    screenName: 'Customer Invoices, 18% GST & Gateway Reconciliation',
    fileName: 'admin_web_crm_customer_invoices_payments.png',
    folder: folders.admin,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/admin_web_crm_customer_invoices_payments.png'
  },
  {
    screenId: 'ADM-05',
    role: 'Admin / Owner CRM',
    category: 'Partner Management',
    screenName: 'Franchise Partner Directory & Multi-Tenant Allocations',
    fileName: 'admin_web_crm_manage_partners.png',
    folder: folders.admin,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/admin_web_crm_manage_partners.png'
  },
  {
    screenId: 'ADM-06',
    role: 'Admin / Owner CRM',
    category: 'Partner Management',
    screenName: 'Regional Partner Hub Dossier (Maharashtra Tier-1 Ops)',
    fileName: 'admin_web_crm_partner_details_maharashtra_team.png',
    folder: folders.admin,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/admin_web_crm_partner_details_maharashtra_team.png'
  },
  {
    screenId: 'ADM-07',
    role: 'Admin / Owner CRM',
    category: 'Technicians & KYC',
    screenName: 'National Electrician Fleet Directory & Shift Status',
    fileName: 'admin_web_crm_manage_technicians.png',
    folder: folders.admin,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/admin_web_crm_manage_technicians.png'
  },
  {
    screenId: 'ADM-08',
    role: 'Admin / Owner CRM',
    category: 'Technicians & KYC',
    screenName: 'Electrician Profile, License & Telemetry (Rajesh Kumar)',
    fileName: 'admin_web_crm_technician_profile_rajesh_kumar.png',
    folder: folders.admin,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/admin_web_crm_technician_profile_rajesh_kumar.png'
  },
  {
    screenId: 'ADM-09',
    role: 'Admin / Owner CRM',
    category: 'Technicians & KYC',
    screenName: 'National Electrician KYC & Safety Kit Certification Review',
    fileName: 'admin_web_crm_technician_kyc_review.png',
    folder: folders.admin,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/admin_web_crm_technician_kyc_review.png'
  },
  {
    screenId: 'ADM-10',
    role: 'Admin / Owner CRM',
    category: 'Customer CRM',
    screenName: 'Customer Directory & VIP Lifetime Value Management',
    fileName: 'admin_web_crm_manage_customers.png',
    folder: folders.admin,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/admin_web_crm_manage_customers.png'
  },
  {
    screenId: 'ADM-11',
    role: 'Admin / Owner CRM',
    category: 'Customer CRM',
    screenName: 'Customer Profile Dossier & Booking History (Amit Sharma)',
    fileName: 'admin_web_crm_customer_profile_amit_sharma.png',
    folder: folders.admin,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/admin_web_crm_customer_profile_amit_sharma.png'
  },
  {
    screenId: 'ADM-12',
    role: 'Admin / Owner CRM',
    category: 'Service Catalog',
    screenName: 'Master Electrical Service Catalog & Price Tiers',
    fileName: 'admin_web_crm_service_catalog.png',
    folder: folders.admin,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/admin_web_crm_service_catalog.png'
  },
  {
    screenId: 'ADM-13',
    role: 'Admin / Owner CRM',
    category: 'Service Catalog',
    screenName: 'Service Category Management & Emergency SOS Matrix',
    fileName: 'admin_web_crm_service_category_management.png',
    folder: folders.admin,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/admin_web_crm_service_category_management.png'
  },
  {
    screenId: 'ADM-14',
    role: 'Admin / Owner CRM',
    category: 'Territory & Coverage',
    screenName: 'Pan-India State Allocation & Regional Quota Control',
    fileName: 'admin_web_crm_state_allocation_management.png',
    folder: folders.admin,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/admin_web_crm_state_allocation_management.png'
  },
  {
    screenId: 'ADM-15',
    role: 'Admin / Owner CRM',
    category: 'Territory & Coverage',
    screenName: 'Pincode Territory Coverage, Exclusive Hubs & Densities',
    fileName: 'admin_web_crm_pincode_coverage_settings.png',
    folder: folders.admin,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/admin_web_crm_pincode_coverage_settings.png'
  },
  {
    screenId: 'ADM-16',
    role: 'Admin / Owner CRM',
    category: 'Subscriptions (AMC)',
    screenName: 'ZEX-Shield Annual Maintenance Subscription Modules',
    fileName: 'admin_web_crm_subscription_modules.png',
    folder: folders.admin,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/admin_web_crm_subscription_modules.png'
  },
  {
    screenId: 'ADM-17',
    role: 'Admin / Owner CRM',
    category: 'Subscriptions (AMC)',
    screenName: 'ZEX-Shield Commercial Plan Tier Contract Details',
    fileName: 'admin_web_crm_subscription_details.png',
    folder: folders.admin,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/admin_web_crm_subscription_details.png'
  },
  {
    screenId: 'ADM-18',
    role: 'Admin / Owner CRM',
    category: 'Support Desk',
    screenName: 'Omnichannel Support Desk & Escalation Queue',
    fileName: 'admin_web_crm_support_desk.png',
    folder: folders.admin,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/admin_web_crm_support_desk.png'
  },
  {
    screenId: 'ADM-19',
    role: 'Admin / Owner CRM',
    category: 'Support Desk',
    screenName: 'Critical SLA Escalation Ticket Dossier (SUP-1024)',
    fileName: 'admin_web_crm_support_ticket_details_sup_1024.png',
    folder: folders.admin,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/admin_web_crm_support_ticket_details_sup_1024.png'
  },
  {
    screenId: 'ADM-20',
    role: 'Admin / Owner CRM',
    category: 'Security & Audit',
    screenName: 'WORM Cryptographic Immutable Audit Logs Ledger',
    fileName: 'admin_web_crm_audit_logs.png',
    folder: folders.admin,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/admin_web_crm_audit_logs.png'
  },
  {
    screenId: 'ADM-21',
    role: 'Admin / Owner CRM',
    category: 'Platform Settings',
    screenName: 'Platform Security, SLA Thresholds & System Settings',
    fileName: 'admin_web_crm_system_settings.png',
    folder: folders.admin,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/admin_web_crm_system_settings.png'
  },
  {
    screenId: 'ADM-22',
    role: 'Admin / Owner CRM',
    category: 'Platform Settings',
    screenName: 'Super Admin Executive Profile & Security Credentials',
    fileName: 'admin_web_crm_profile_settings.png',
    folder: folders.admin,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/admin_web_crm_profile_settings.png'
  },

  // ==========================================
  // 2. PARTNER WEB CRM (17 Screens)
  // ==========================================
  {
    screenId: 'PTN-CRM-01',
    role: 'Partner CRM / App',
    category: 'Dashboard & Operations',
    screenName: 'Regional Franchise Command Center (Maharashtra Hub)',
    fileName: 'partner_web_crm_dashboard_maharashtra_team.png',
    folder: folders.partnerCrm,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/partner_web_crm_dashboard_maharashtra_team.png'
  },
  {
    screenId: 'PTN-CRM-02',
    role: 'Partner CRM / App',
    category: 'Jobs & Escalations',
    screenName: 'Regional Work Order Dispatch & Monitoring Desk',
    fileName: 'partner_web_crm_job_management.png',
    folder: folders.partnerCrm,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/partner_web_crm_job_management.png'
  },
  {
    screenId: 'PTN-CRM-03',
    role: 'Partner CRM / App',
    category: 'Jobs & Escalations',
    screenName: 'Live Work Order Dispatch Dossier (Job J-1001)',
    fileName: 'partner_web_crm_job_details_j_1001.png',
    folder: folders.partnerCrm,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/partner_web_crm_job_details_j_1001.png'
  },
  {
    screenId: 'PTN-CRM-04',
    role: 'Partner CRM / App',
    category: 'Jobs & Escalations',
    screenName: 'SLA Breach Emergency Escalated Jobs Queue',
    fileName: 'partner_web_crm_escalated_jobs.png',
    folder: folders.partnerCrm,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/partner_web_crm_escalated_jobs.png'
  },
  {
    screenId: 'PTN-CRM-05',
    role: 'Partner CRM / App',
    category: 'Fleet & KYC',
    screenName: 'Regional Technician Fleet Directory & Live Shift Duty',
    fileName: 'partner_web_crm_manage_technicians.png',
    folder: folders.partnerCrm,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/partner_web_crm_manage_technicians.png'
  },
  {
    screenId: 'PTN-CRM-06',
    role: 'Partner CRM / App',
    category: 'Fleet & KYC',
    screenName: 'Regional Technician Profile & Tool Kit Dossier (Rajesh Kumar)',
    fileName: 'partner_web_crm_technician_profile_rajesh_kumar.png',
    folder: folders.partnerCrm,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/partner_web_crm_technician_profile_rajesh_kumar.png'
  },
  {
    screenId: 'PTN-CRM-07',
    role: 'Partner CRM / App',
    category: 'Fleet & KYC',
    screenName: 'Regional Electrician Safety & License Onboarding Review',
    fileName: 'partner_web_crm_technician_kyc_review.png',
    folder: folders.partnerCrm,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/partner_web_crm_technician_kyc_review.png'
  },
  {
    screenId: 'PTN-CRM-08',
    role: 'Partner CRM / App',
    category: 'Fleet & KYC',
    screenName: 'Emergency Technician Live Reassignment Console (J-1005)',
    fileName: 'partner_web_crm_technician_reassignment_j_1005.png',
    folder: folders.partnerCrm,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/partner_web_crm_technician_reassignment_j_1005.png'
  },
  {
    screenId: 'PTN-CRM-09',
    role: 'Partner CRM / App',
    category: 'Finance & Invoices',
    screenName: 'Franchise Double-Entry Transactions & Commission Ledger',
    fileName: 'partner_web_crm_transactions_ledger.png',
    folder: folders.partnerCrm,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/partner_web_crm_transactions_ledger.png'
  },
  {
    screenId: 'PTN-CRM-10',
    role: 'Partner CRM / App',
    category: 'Finance & Invoices',
    screenName: 'Regional Invoices & Customer GST Filing Registry',
    fileName: 'partner_web_crm_invoices.png',
    folder: folders.partnerCrm,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/partner_web_crm_invoices.png'
  },
  {
    screenId: 'PTN-CRM-11',
    role: 'Partner CRM / App',
    category: 'Finance & Invoices',
    screenName: 'Statutory 18% GST Tax Invoice Print Preview (INV-2026-001)',
    fileName: 'partner_web_crm_invoice_preview_inv_2026_001.png',
    folder: folders.partnerCrm,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/partner_web_crm_invoice_preview_inv_2026_001.png'
  },
  {
    screenId: 'PTN-CRM-12',
    role: 'Partner CRM / App',
    category: 'Finance & Invoices',
    screenName: 'Technician Bi-Weekly Payout Distribution Desk',
    fileName: 'partner_web_crm_finance_payouts.png',
    folder: folders.partnerCrm,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/partner_web_crm_finance_payouts.png'
  },
  {
    screenId: 'PTN-CRM-13',
    role: 'Partner CRM / App',
    category: 'Territory & Capacity',
    screenName: 'Territory Pincode Quota & Emergency Capacity Control',
    fileName: 'partner_web_crm_pincode_coverage_capacity.png',
    folder: folders.partnerCrm,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/partner_web_crm_pincode_coverage_capacity.png'
  },
  {
    screenId: 'PTN-CRM-14',
    role: 'Partner CRM / App',
    category: 'Territory & Capacity',
    screenName: 'Colaba 400001 Density, Capacity & Fleet Allocation Details',
    fileName: 'partner_web_crm_pincode_details_400001_colaba.png',
    folder: folders.partnerCrm,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/partner_web_crm_pincode_details_400001_colaba.png'
  },
  {
    screenId: 'PTN-CRM-15',
    role: 'Partner CRM / App',
    category: 'Support & Disputes',
    screenName: 'Regional Franchise Support Desk & Dispute Resolution',
    fileName: 'partner_web_crm_support_center.png',
    folder: folders.partnerCrm,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/partner_web_crm_support_center.png'
  },
  {
    screenId: 'PTN-CRM-16',
    role: 'Partner CRM / App',
    category: 'Support & Disputes',
    screenName: 'Customer Support Escalation Ticket Details (SUP-1024)',
    fileName: 'partner_web_crm_support_ticket_details_sup_1024.png',
    folder: folders.partnerCrm,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/partner_web_crm_support_ticket_details_sup_1024.png'
  },
  {
    screenId: 'PTN-CRM-17',
    role: 'Partner CRM / App',
    category: 'Partner Settings',
    screenName: 'Franchise Partner Profile & Regional Operating License',
    fileName: 'partner_web_crm_profile_settings.png',
    folder: folders.partnerCrm,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/partner_web_crm_profile_settings.png'
  },

  // ==========================================
  // 3. PARTNER MOBILE APP (4 Screens)
  // ==========================================
  {
    screenId: 'PTN-APP-01',
    role: 'Partner CRM / App',
    category: 'Mobile Operations',
    screenName: 'Partner Mobile Operations Dashboard & Active Dispatch Fleet',
    fileName: '05_partner_app_operations_dashboard.png',
    folder: folders.partnerApp,
    sourceRel: 'APP/stitch_electricare_mobile_app_suite/ALL_APP_SCREENS_FOR_FIGMA/05_partner_app_operations_dashboard.png'
  },
  {
    screenId: 'PTN-APP-02',
    role: 'Partner CRM / App',
    category: 'Mobile Dispatch',
    screenName: 'Emergency Job Escalation & Live Technician Reassignment',
    fileName: '04_partner_app_escalations_reassign_tech.png',
    folder: folders.partnerApp,
    sourceRel: 'APP/stitch_electricare_mobile_app_suite/ALL_APP_SCREENS_FOR_FIGMA/04_partner_app_escalations_reassign_tech.png'
  },
  {
    screenId: 'PTN-APP-03',
    role: 'Partner CRM / App',
    category: 'Mobile Fleet Management',
    screenName: 'Mobile Electrician Fleet Directory & KYC Document Verification',
    fileName: '07_partner_app_technician_fleet_kyc.png',
    folder: folders.partnerApp,
    sourceRel: 'APP/stitch_electricare_mobile_app_suite/ALL_APP_SCREENS_FOR_FIGMA/07_partner_app_technician_fleet_kyc.png'
  },
  {
    screenId: 'PTN-APP-04',
    role: 'Partner CRM / App',
    category: 'Mobile Finance',
    screenName: 'Regional Franchise Mobile Finance & 15% Commission Payouts',
    fileName: '06_partner_app_regional_finance_payouts.png',
    folder: folders.partnerApp,
    sourceRel: 'APP/stitch_electricare_mobile_app_suite/ALL_APP_SCREENS_FOR_FIGMA/06_partner_app_regional_finance_payouts.png'
  },

  // ==========================================
  // 4. TECHNICIAN APP (5 Screens)
  // ==========================================
  {
    screenId: 'TECH-01',
    role: 'Technician App',
    category: 'Shift & Dispatch',
    screenName: 'Field Electrician Shift Dashboard & Active Dispatch Queue',
    fileName: '08_technician_app_dashboard_active_queue.png',
    folder: folders.techApp,
    sourceRel: 'APP/stitch_electricare_mobile_app_suite/ALL_APP_SCREENS_FOR_FIGMA/08_technician_app_dashboard_active_queue.png'
  },
  {
    screenId: 'TECH-02',
    role: 'Technician App',
    category: 'Navigation & Contact',
    screenName: 'Doorstep GPS Turn-by-Turn Navigation & Customer Contact',
    fileName: '10_technician_app_job_details_navigation.png',
    folder: folders.techApp,
    sourceRel: 'APP/stitch_electricare_mobile_app_suite/ALL_APP_SCREENS_FOR_FIGMA/10_technician_app_job_details_navigation.png'
  },
  {
    screenId: 'TECH-03',
    role: 'Technician App',
    category: 'Safety Protocols',
    screenName: '1000V Class 0 Gloves & Main MCB Isolation Safety Interlock',
    fileName: '11_technician_app_safety_verification_checklist.png',
    folder: folders.techApp,
    sourceRel: 'APP/stitch_electricare_mobile_app_suite/ALL_APP_SCREENS_FOR_FIGMA/11_technician_app_safety_verification_checklist.png'
  },
  {
    screenId: 'TECH-04',
    role: 'Technician App',
    category: 'Job Execution & OTP',
    screenName: 'Post-Work Photo Proof & Customer 4-Digit Handover OTP',
    fileName: '12_technician_app_work_progress_completion_otp.png',
    folder: folders.techApp,
    sourceRel: 'APP/stitch_electricare_mobile_app_suite/ALL_APP_SCREENS_FOR_FIGMA/12_technician_app_work_progress_completion_otp.png'
  },
  {
    screenId: 'TECH-05',
    role: 'Technician App',
    category: 'Earnings & Payouts',
    screenName: '70% Direct Net Earnings Breakdown & Instant Payout Wallet',
    fileName: '09_technician_app_earnings_payouts.png',
    folder: folders.techApp,
    sourceRel: 'APP/stitch_electricare_mobile_app_suite/ALL_APP_SCREENS_FOR_FIGMA/09_technician_app_earnings_payouts.png'
  },

  // ==========================================
  // 5. CUSTOMER APP (3 Screens)
  // ==========================================
  {
    screenId: 'CUST-01',
    role: 'Customer App',
    category: 'Home & Discovery',
    screenName: 'Customer Home Dashboard, Search & Quick Actions',
    fileName: '01_customer_app_home_dashboard.png',
    folder: folders.custApp,
    sourceRel: 'APP/stitch_electricare_mobile_app_suite/ALL_APP_SCREENS_FOR_FIGMA/01_customer_app_home_dashboard.png'
  },
  {
    screenId: 'CUST-02',
    role: 'Customer App',
    category: 'Live Tracking',
    screenName: 'Real-Time Technician GPS Live Tracking & En-Route ETA',
    fileName: '03_customer_app_live_tracking.png',
    folder: folders.custApp,
    sourceRel: 'APP/stitch_electricare_mobile_app_suite/ALL_APP_SCREENS_FOR_FIGMA/03_customer_app_live_tracking.png'
  },
  {
    screenId: 'CUST-03',
    role: 'Customer App',
    category: 'Invoice & Sign-off',
    screenName: 'Job Completion 18% GST Invoice, PDF Download & Star Rating',
    fileName: '02_customer_app_invoice_receipt.png',
    folder: folders.custApp,
    sourceRel: 'APP/stitch_electricare_mobile_app_suite/ALL_APP_SCREENS_FOR_FIGMA/02_customer_app_invoice_receipt.png'
  },

  // ==========================================
  // 6. COMMON / SYSTEM DESIGN SYSTEM (2 Boards)
  // ==========================================
  {
    screenId: 'SYS-01',
    role: 'Common / System',
    category: 'Design System Foundation',
    screenName: 'Design System Foundation Board 1 (Colors, Type Tokens, Spacing)',
    fileName: 'partner_web_crm_final_design_system_board_1.png',
    folder: folders.sys,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/partner_web_crm_final_design_system_board_1.png'
  },
  {
    screenId: 'SYS-02',
    role: 'Common / System',
    category: 'Component Library',
    screenName: 'Design System Component Board 2 (Widgets, Tables, Form Controls)',
    fileName: 'partner_web_crm_final_design_system_board_2.png',
    folder: folders.sys,
    sourceRel: 'ALL_SCREENS_FOR_FIGMA/partner_web_crm_final_design_system_board_2.png'
  }
];

// Copy each file with clean ID-prefixed filename into export folder
screens.forEach(s => {
  const src = path.join(rootDir, s.sourceRel);
  const destName = `${s.screenId}_${s.fileName}`;
  const dest = path.join(s.folder, destName);
  fs.copyFileSync(src, dest);
});

fs.writeFileSync('scripts/master_screen_inventory_v2.json', JSON.stringify(screens, null, 2));
console.log(`Sequenced and exported all ${screens.length} screens perfectly.`);
