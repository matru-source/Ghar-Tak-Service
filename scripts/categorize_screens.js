const fs = require('fs');
const path = require('path');

const rootDir = 'D:\\ZEX\\Ghar tak\\Assets\\figma';

// 1. All screens in ALL_SCREENS_FOR_FIGMA
const webDir = path.join(rootDir, 'ALL_SCREENS_FOR_FIGMA');
const webFiles = fs.readdirSync(webDir).filter(f => f.endsWith('.png'));

// 2. All screens in ALL_APP_SCREENS_FOR_FIGMA
const appDir = path.join(rootDir, 'APP', 'stitch_electricare_mobile_app_suite', 'ALL_APP_SCREENS_FOR_FIGMA');
const appFiles = fs.readdirSync(appDir).filter(f => f.endsWith('.png'));

console.log('Web files count:', webFiles.length);
console.log('App files count:', appFiles.length);

const inventory = [];

// Process Web Files
webFiles.forEach(file => {
  const base = path.basename(file, '.png');
  let role = '';
  let category = '';
  let screenName = '';

  if (base.startsWith('admin_web_crm_')) {
    role = 'Admin / Owner CRM';
    const sub = base.replace('admin_web_crm_', '');
    if (sub.includes('dashboard')) {
      category = 'Dashboard & Analytics';
      screenName = 'Platform Overview & KPI Dashboard';
    } else if (sub.includes('finance') || sub.includes('commission')) {
      category = 'Finance & Commission';
      if (sub.includes('commission_configuration')) screenName = 'Global Commission & Tariffs Configuration';
      else if (sub.includes('customer_invoices')) screenName = 'Customer Invoices & Gateway Reconciliation';
      else screenName = 'Enterprise Finance & Partner Settlement Overview';
    } else if (sub.includes('partner')) {
      category = 'Partner Management';
      if (sub.includes('details')) screenName = 'Regional Partner Operations Hub (Maharashtra Tier-1)';
      else screenName = 'Franchise Partner Directory & Allocation';
    } else if (sub.includes('technician')) {
      category = 'Technician & KYC';
      if (sub.includes('kyc')) screenName = 'National Electrician KYC & Safety Certification Review';
      else if (sub.includes('profile')) screenName = 'Field Electrician Profile & Telemetry (Rajesh Kumar)';
      else screenName = 'National Technician Fleet Management';
    } else if (sub.includes('customer')) {
      category = 'Customer Management';
      if (sub.includes('profile')) screenName = 'Customer CRM Dossier & Booking History (Amit Sharma)';
      else screenName = 'Customer User Management & Directory';
    } else if (sub.includes('service')) {
      category = 'Service Catalog';
      if (sub.includes('category')) screenName = 'Service Category & Emergency SOS Matrix';
      else screenName = 'Master Electrical Service Catalog & Price Tiers';
    } else if (sub.includes('pincode') || sub.includes('state')) {
      category = 'Territory & Coverage';
      if (sub.includes('state')) screenName = 'Pan-India State Allocation & Quota Management';
      else screenName = 'Territory Pincode Coverage & Density Mapping';
    } else if (sub.includes('subscription')) {
      category = 'Subscriptions';
      if (sub.includes('details')) screenName = 'ZEX-Shield Commercial Annual Plan Dossier';
      else screenName = 'ZEX-Shield AMC Subscription Management';
    } else if (sub.includes('support')) {
      category = 'Support Desk';
      if (sub.includes('details')) screenName = 'SLA Escalation Ticket Details (SUP-1024 Sparking Risk)';
      else screenName = 'Omnichannel Support Desk & Ticket Queue';
    } else if (sub.includes('audit')) {
      category = 'Security & Audit';
      screenName = 'WORM Compliance Ledger & Cryptographic Audit Logs';
    } else if (sub.includes('profile') || sub.includes('system')) {
      category = 'Settings & Profile';
      if (sub.includes('system')) screenName = 'Enterprise Platform Configurations & SLA Rules';
      else screenName = 'Super Admin Executive Profile & Security Credentials';
    } else {
      category = 'General';
      screenName = sub;
    }
  } else if (base.startsWith('partner_web_crm_')) {
    const sub = base.replace('partner_web_crm_', '');
    if (sub.includes('design_system')) {
      role = 'Common / System';
      category = 'Design System & Standards';
      screenName = sub.includes('board_1') ? 'Design System Foundation Board 1 (Tokens, Colors, Elevation)' : 'Design System Component Board 2 (Widgets, Tables, Buttons)';
    } else {
      role = 'Partner CRM / App';
      if (sub.includes('dashboard')) {
        category = 'Dashboard & Operations';
        screenName = 'Regional Franchise Command Center (Maharashtra Hub)';
      } else if (sub.includes('job') || sub.includes('escalated')) {
        category = 'Job Dispatch & Escalations';
        if (sub.includes('escalated')) screenName = 'SLA Breach & Escalated Emergency Jobs Queue';
        else if (sub.includes('details')) screenName = 'Live Work Order Dispatch Dossier (J-1001)';
        else screenName = 'Regional Work Order Dispatch & Monitoring Desk';
      } else if (sub.includes('finance') || sub.includes('invoice') || sub.includes('ledger')) {
        category = 'Finance & Invoices';
        if (sub.includes('invoice_preview')) screenName = 'GST Tax Invoice Print Preview (INV-2026-001)';
        else if (sub.includes('invoices')) screenName = 'Regional Franchise Invoices & Tax Registry';
        else if (sub.includes('payouts')) screenName = 'Technician Bi-Weekly Payout Distribution Desk';
        else screenName = 'Franchise Double-Entry Transactions Ledger';
      } else if (sub.includes('technician') || sub.includes('kyc')) {
        category = 'Fleet & KYC Verification';
        if (sub.includes('kyc')) screenName = 'Regional Electrician Safety & License Onboarding Review';
        else if (sub.includes('profile')) screenName = 'Regional Technician Performance & Tools Dossier (Rajesh Kumar)';
        else if (sub.includes('reassignment')) screenName = 'Emergency Technician Live Reassignment Console (J-1005)';
        else screenName = 'Regional Technician Fleet Directory & Live Shift Duty';
      } else if (sub.includes('pincode')) {
        category = 'Territory & Capacity';
        if (sub.includes('details')) screenName = 'Colaba Pincode 400001 Density & Fleet Distribution';
        else screenName = 'Territory Pincode Quota & Emergency Capacity Control';
      } else if (sub.includes('support')) {
        category = 'Support Center';
        if (sub.includes('details')) screenName = 'Customer Support Case Resolution (SUP-1024)';
        else screenName = 'Franchise Partner Support & Dispute Hub';
      } else if (sub.includes('profile')) {
        category = 'Settings & Profile';
        screenName = 'Franchise Partner Profile & Operating Agreement';
      } else {
        category = 'General';
        screenName = sub;
      }
    }
  }

  inventory.push({
    file,
    relPath: path.join('ALL_SCREENS_FOR_FIGMA', file),
    role,
    category,
    screenName
  });
});

// Process App Files
appFiles.forEach(file => {
  let role = '';
  let category = '';
  let screenName = '';

  if (file.includes('customer_app')) {
    role = 'Customer App';
    if (file.includes('home_dashboard')) {
      category = 'Home & Booking';
      screenName = 'Customer Home Screen & Service Quick Actions';
    } else if (file.includes('live_tracking')) {
      category = 'Tracking & Navigation';
      screenName = 'Real-Time Technician GPS Live Tracking & En-Route ETA';
    } else if (file.includes('invoice_receipt')) {
      category = 'Billing & Sign-off';
      screenName = 'Job Completion Invoice, GST Receipt & Quality Rating';
    }
  } else if (file.includes('partner_app')) {
    role = 'Partner CRM / App';
    if (file.includes('operations_dashboard')) {
      category = 'Mobile Operations';
      screenName = 'Partner Mobile Operations Dashboard & Active Dispatch';
    } else if (file.includes('escalations_reassign')) {
      category = 'Mobile Dispatch';
      screenName = 'Emergency Job Escalation & Field Reassignment Console';
    } else if (file.includes('technician_fleet_kyc')) {
      category = 'Mobile Fleet Management';
      screenName = 'Mobile Technician Fleet List & KYC Verification Status';
    } else if (file.includes('regional_finance_payouts')) {
      category = 'Mobile Finance';
      screenName = 'Regional Franchise Mobile Finance & Commission Payouts';
    }
  } else if (file.includes('technician_app')) {
    role = 'Technician App';
    if (file.includes('dashboard_active_queue')) {
      category = 'Duty & Dispatch Queue';
      screenName = 'Field Electrician Shift Dashboard & Active Dispatch Queue';
    } else if (file.includes('job_details_navigation')) {
      category = 'Navigation & Job Details';
      screenName = 'Doorstep Turn-by-Turn GPS Navigation & Customer Contact';
    } else if (file.includes('safety_verification_checklist')) {
      category = 'Safety Protocols';
      screenName = '1000V Class 0 Gloves & Main MCB Isolation Safety Interlock';
    } else if (file.includes('work_progress_completion_otp')) {
      category = 'Job Execution & Sign-off';
      screenName = 'Post-Service Photographic Evidence & Handover OTP Verification';
    } else if (file.includes('earnings_payouts')) {
      category = 'Earnings & Wallet';
      screenName = '70% Direct Net Earnings Breakdown & Instant Payout Wallet';
    }
  }

  inventory.push({
    file,
    relPath: path.join('APP', 'stitch_electricare_mobile_app_suite', 'ALL_APP_SCREENS_FOR_FIGMA', file),
    role,
    category,
    screenName
  });
});

console.log('Total categorized items:', inventory.length);
fs.writeFileSync('scripts/categorized_inventory.json', JSON.stringify(inventory, null, 2));
