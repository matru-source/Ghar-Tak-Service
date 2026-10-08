const fs = require('fs');
const path = require('path');

function createCombinedWeb(inputDir, outputFile, title, maxCount = 99) {
  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.html')).sort();
  const selectedFiles = files.slice(0, maxCount);

  const firstContent = fs.readFileSync(path.join(inputDir, selectedFiles[0]), 'utf8');
  const headMatch = firstContent.match(/<head>([\s\S]*?)<\/head>/i);
  const headContent = headMatch ? headMatch[1] : '';

  let screensHtml = '';

  selectedFiles.forEach((file) => {
    let content = fs.readFileSync(path.join(inputDir, file), 'utf8');
    const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let bodyInner = bodyMatch ? bodyMatch[1] : content;

    // Convert 'fixed' to 'absolute'
    bodyInner = bodyInner.replace(/\bfixed\b/g, 'absolute');

    screensHtml += `
      <div style="display: flex; flex-direction: column; margin-bottom: 64px;">
        <div style="margin-bottom: 14px; font-family: Inter, sans-serif; font-size: 18px; font-weight: 700; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.05em;">
          ${file.replace('.html', '').replace(/_/g, ' ')}
        </div>
        <div class="web-frame" style="width: 1440px; height: 900px; position: relative; overflow-y: auto; overflow-x: hidden; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4); border: 2px solid #334155; background: #faf8ff;">
          ${bodyInner}
        </div>
      </div>
    `;
  });

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  ${headContent}
  <style>
    body {
      margin: 0;
      padding: 40px;
      background-color: #0f172a;
      min-height: 100vh;
      font-family: 'Inter', sans-serif;
    }
  </style>
</head>
<body>
  ${screensHtml}
</body>
</html>`;

  fs.writeFileSync(outputFile, fullHtml, 'utf8');
  console.log(`Created: ${outputFile} (${selectedFiles.length} screens)`);
}

// 1. Admin CRM (All 22 screens in 2 easy files of 11 screens each)
const adminDir = 'D:/ZEX/Ghar tak/Assets/figma/FIGMA_HTML_EXPORT/01_ADMIN_OWNER_CRM';
const adminFiles = fs.readdirSync(adminDir).filter(f => f.endsWith('.html')).sort();

function createAdminSlice(filesSlice, outputFile, title) {
  const firstContent = fs.readFileSync(path.join(adminDir, filesSlice[0]), 'utf8');
  const headMatch = firstContent.match(/<head>([\s\S]*?)<\/head>/i);
  const headContent = headMatch ? headMatch[1] : '';

  let screensHtml = '';
  filesSlice.forEach(file => {
    let content = fs.readFileSync(path.join(adminDir, file), 'utf8');
    const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let bodyInner = bodyMatch ? bodyMatch[1] : content;
    bodyInner = bodyInner.replace(/\bfixed\b/g, 'absolute');
    screensHtml += `
      <div style="display: flex; flex-direction: column; margin-bottom: 64px;">
        <div style="margin-bottom: 14px; font-family: Inter, sans-serif; font-size: 18px; font-weight: 700; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.05em;">
          ${file.replace('.html', '').replace(/_/g, ' ')}
        </div>
        <div class="web-frame" style="width: 1440px; height: 900px; position: relative; overflow-y: auto; overflow-x: hidden; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4); border: 2px solid #334155; background: #faf8ff;">
          ${bodyInner}
        </div>
      </div>
    `;
  });

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  ${headContent}
  <style>
    body {
      margin: 0;
      padding: 40px;
      background-color: #0f172a;
      min-height: 100vh;
      font-family: 'Inter', sans-serif;
    }
  </style>
</head>
<body>
  ${screensHtml}
</body>
</html>`;
  fs.writeFileSync(outputFile, fullHtml, 'utf8');
  console.log(`Created: ${outputFile} (${filesSlice.length} screens)`);
}

createAdminSlice(adminFiles.slice(0, 11), 'D:/ZEX/Ghar tak/Assets/figma/FIGMA_ROLE_ZIPS/COMBINED_ADMIN_CRM_PART1_11_SCREENS.html', 'Admin CRM Part 1');
createAdminSlice(adminFiles.slice(11), 'D:/ZEX/Ghar tak/Assets/figma/FIGMA_ROLE_ZIPS/COMBINED_ADMIN_CRM_PART2_11_SCREENS.html', 'Admin CRM Part 2');

// 2. Partner Web CRM (17 screens)
createCombinedWeb(
  'D:/ZEX/Ghar tak/Assets/figma/FIGMA_HTML_EXPORT/02_PARTNER_WEB_CRM',
  'D:/ZEX/Ghar tak/Assets/figma/FIGMA_ROLE_ZIPS/COMBINED_PARTNER_WEB_CRM_17_SCREENS.html',
  'Partner Web CRM Showcase'
);

// 3. Design System (2 boards)
createCombinedWeb(
  'D:/ZEX/Ghar tak/Assets/figma/FIGMA_HTML_EXPORT/06_COMMON_DESIGN_SYSTEM',
  'D:/ZEX/Ghar tak/Assets/figma/FIGMA_ROLE_ZIPS/COMBINED_DESIGN_SYSTEM_2_BOARDS.html',
  'Design System Boards'
);
