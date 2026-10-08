const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const baseDir = 'D:/ZEX/Ghar tak/Assets/figma/FIGMA_HTML_EXPORT';
const outDir = 'D:/ZEX/Ghar tak/Assets/figma/FIGMA_ROLE_ZIPS';

if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

function runZip(source, zipName) {
  const zipPath = path.join(outDir, zipName);
  const cmd = `powershell -NoProfile -Command "Compress-Archive -Path '${source}\\*' -DestinationPath '${zipPath}' -Force"`;
  console.log('Running:', zipName);
  execSync(cmd, { stdio: 'inherit' });
}

// 1. Admin CRM (22 screens)
runZip(path.join(baseDir, '01_ADMIN_OWNER_CRM'), '1_ADMIN_CRM_22_Screens.zip');

// 2. Partner Web CRM (17 screens)
runZip(path.join(baseDir, '02_PARTNER_WEB_CRM'), '2_PARTNER_WEB_CRM_17_Screens.zip');

// 3. Partner Mobile App (4 screens)
runZip(path.join(baseDir, '03_PARTNER_MOBILE_APP'), '3_PARTNER_MOBILE_APP_4_Screens.zip');

// 4. Technician Mobile App (5 screens)
runZip(path.join(baseDir, '04_TECHNICIAN_MOBILE_APP'), '4_TECHNICIAN_MOBILE_APP_5_Screens.zip');

// 5. Customer Mobile App (3 screens)
runZip(path.join(baseDir, '05_CUSTOMER_MOBILE_APP'), '5_CUSTOMER_MOBILE_APP_3_Screens.zip');

// 6. Common Design System (2 boards)
runZip(path.join(baseDir, '06_COMMON_DESIGN_SYSTEM'), '6_DESIGN_SYSTEM_2_Boards.zip');

console.log('\n--- SUCCESS! ALL 6 ROLE ZIPS CREATED ---');
fs.readdirSync(outDir).forEach(f => {
  const sz = (fs.statSync(path.join(outDir, f)).size / 1024).toFixed(1);
  console.log(`${f} -> ${sz} KB`);
});
