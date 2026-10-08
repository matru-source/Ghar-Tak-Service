const fs = require('fs');
const path = require('path');

const rootDir = 'D:/ZEX/Ghar tak/Assets/figma';
const targetDir = path.join(rootDir, 'FIGMA_HTML_EXPORT');

if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(targetDir, { recursive: true });

const folders = {
  admin: path.join(targetDir, '01_ADMIN_OWNER_CRM'),
  partnerCrm: path.join(targetDir, '02_PARTNER_WEB_CRM'),
  partnerApp: path.join(targetDir, '03_PARTNER_MOBILE_APP'),
  techApp: path.join(targetDir, '04_TECHNICIAN_MOBILE_APP'),
  custApp: path.join(targetDir, '05_CUSTOMER_MOBILE_APP'),
  sys: path.join(targetDir, '06_COMMON_DESIGN_SYSTEM')
};
Object.values(folders).forEach(f => fs.mkdirSync(f, { recursive: true }));

const inv = require('./master_screen_inventory_v2.json');

let copied = 0;
inv.forEach(s => {
  let htmlPath = null;
  if (s.fileName.startsWith('admin_web_crm_')) {
    const folderName = s.fileName.replace('.png', '');
    const p = path.join(rootDir, folderName, 'code.html');
    if (fs.existsSync(p)) htmlPath = p;
  } else if (s.fileName.startsWith('partner_web_crm_')) {
    const folderName = s.fileName.replace('.png', '');
    const p = path.join(rootDir, folderName, 'code.html');
    if (fs.existsSync(p)) htmlPath = p;
  } else {
    const appDir = path.join(rootDir, 'APP/stitch_electricare_mobile_app_suite');
    const folderMap = {
      '01_customer_app_home_dashboard.png': 'customer_app_home_dashboard/1.html',
      '02_customer_app_invoice_receipt.png': 'customer_app_invoice_receipt/code.html',
      '03_customer_app_live_tracking.png': 'customer_app_live_tracking/code.html',
      '04_partner_app_escalations_reassign_tech.png': 'partner_app_escalations_reassign_tech/code.html',
      '05_partner_app_operations_dashboard.png': 'partner_app_operations_dashboard/code.html',
      '06_partner_app_regional_finance_payouts.png': 'partner_app_regional_finance_payouts/6.html',
      '07_partner_app_technician_fleet_kyc.png': 'partner_app_technician_fleet_kyc/code.html',
      '08_technician_app_dashboard_active_queue.png': 'technician_app_dashboard_active_queue/code.html',
      '09_technician_app_earnings_payouts.png': 'technician_app_earnings_payouts/code.html',
      '10_technician_app_job_details_navigation.png': 'technician_app_job_details_navigation/code.html',
      '11_technician_app_safety_verification_checklist.png': 'technician_app_safety_verification_checklist/code.html',
      '12_technician_app_work_progress_completion_otp.png': 'technician_app_work_progress_completion_otp/code.html'
    };
    if (folderMap[s.fileName]) {
      const p = path.join(appDir, folderMap[s.fileName]);
      if (fs.existsSync(p)) htmlPath = p;
    }
  }

  let destFolder = folders.admin;
  if (s.screenId.startsWith('PTN-CRM')) destFolder = folders.partnerCrm;
  else if (s.screenId.startsWith('PTN-APP')) destFolder = folders.partnerApp;
  else if (s.screenId.startsWith('TECH')) destFolder = folders.techApp;
  else if (s.screenId.startsWith('CUST')) destFolder = folders.custApp;
  else if (s.screenId.startsWith('SYS')) destFolder = folders.sys;

  if (htmlPath) {
    const destName = s.screenId + '_' + s.fileName.replace('.png', '.html');
    fs.copyFileSync(htmlPath, path.join(destFolder, destName));
    copied++;
  } else {
    console.log('Missing html for:', s.screenId, s.fileName);
  }
});

console.log('Successfully organized ' + copied + ' HTML files out of ' + inv.length);
