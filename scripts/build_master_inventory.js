const fs = require('fs');
const path = require('path');

const rootDir = 'D:\\ZEX\\Ghar tak\\Assets\\figma';
const exportDir = path.join(rootDir, 'FIGMA_CLIENT_EXPORT');

if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

const folders = {
  admin: path.join(exportDir, '01_ADMIN_OWNER_CRM'),
  partner: path.join(exportDir, '02_PARTNER_CRM_AND_APP'),
  tech: path.join(exportDir, '03_TECHNICIAN_MOBILE_APP'),
  cust: path.join(exportDir, '04_CUSTOMER_MOBILE_APP'),
  system: path.join(exportDir, '05_COMMON_DESIGN_SYSTEM')
};

Object.values(folders).forEach(f => {
  if (!fs.existsSync(f)) fs.mkdirSync(f, { recursive: true });
});

const inv = require('./categorized_inventory.json');

// Define clean ordering and Screen IDs
const masterList = [];

let admCount = 1;
let ptnWebCount = 1;
let ptnMobCount = 1;
let techCount = 1;
let custCount = 1;
let sysCount = 1;

// Specific sorting order
const order = [
  'Admin / Owner CRM',
  'Partner CRM / App',
  'Technician App',
  'Customer App',
  'Common / System'
];

inv.sort((a, b) => {
  if (a.role !== b.role) {
    return order.indexOf(a.role) - order.indexOf(b.role);
  }
  if (a.category !== b.category) {
    return a.category.localeCompare(b.category);
  }
  return a.screenName.localeCompare(b.screenName);
});

inv.forEach(item => {
  let screenId = '';
  let targetFolder = '';

  if (item.role === 'Admin / Owner CRM') {
    screenId = `ADM-${String(admCount++).padStart(2, '0')}`;
    targetFolder = folders.admin;
  } else if (item.role === 'Partner CRM / App') {
    if (item.relPath.includes('APP')) {
      screenId = `PTN-APP-${String(ptnMobCount++).padStart(2, '0')}`;
    } else {
      screenId = `PTN-CRM-${String(ptnWebCount++).padStart(2, '0')}`;
    }
    targetFolder = folders.partner;
  } else if (item.role === 'Technician App') {
    screenId = `TECH-${String(techCount++).padStart(2, '0')}`;
    targetFolder = folders.tech;
  } else if (item.role === 'Customer App') {
    screenId = `CUST-${String(custCount++).padStart(2, '0')}`;
    targetFolder = folders.cust;
  } else if (item.role === 'Common / System') {
    screenId = `SYS-${String(sysCount++).padStart(2, '0')}`;
    targetFolder = folders.system;
  }

  const srcFile = path.join(rootDir, item.relPath);
  const destFileName = `${screenId}_${path.basename(item.file)}`;
  const destFile = path.join(targetFolder, destFileName);

  fs.copyFileSync(srcFile, destFile);

  masterList.push({
    screenId,
    role: item.role,
    category: item.category,
    screenName: item.screenName,
    fileName: item.file,
    exportFileName: destFileName,
    relativeSource: item.relPath
  });
});

fs.writeFileSync('scripts/master_screen_inventory.json', JSON.stringify(masterList, null, 2));
console.log(`Successfully generated master screen inventory with ${masterList.length} screens.`);
console.log(`Copied all files to: ${exportDir}`);
