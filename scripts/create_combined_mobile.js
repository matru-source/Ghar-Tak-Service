const fs = require('fs');
const path = require('path');

function createCombinedMobile(inputDir, outputFile, title) {
  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.html')).sort();
  
  // Extract Tailwind config and head fonts from the first file
  const firstContent = fs.readFileSync(path.join(inputDir, files[0]), 'utf8');
  const headMatch = firstContent.match(/<head>([\s\S]*?)<\/head>/i);
  const headContent = headMatch ? headMatch[1] : '';

  let screensHtml = '';

  files.forEach((file, idx) => {
    let content = fs.readFileSync(path.join(inputDir, file), 'utf8');
    const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let bodyInner = bodyMatch ? bodyMatch[1] : content;

    // Convert 'fixed' position classes to 'absolute' so they stay within the screen frame
    bodyInner = bodyInner.replace(/\bfixed\b/g, 'absolute');

    screensHtml += `
      <div style="display: flex; flex-direction: column; align-items: center; margin-right: 48px; flex-shrink: 0;">
        <div style="margin-bottom: 12px; font-family: Inter, sans-serif; font-size: 16px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">
          ${file.replace('.html', '').replace(/_/g, ' ')}
        </div>
        <div class="device-frame" style="width: 430px; min-height: 932px; height: 932px; position: relative; overflow-y: auto; overflow-x: hidden; border-radius: 44px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4); border: 6px solid #1e293b; background: #f8f9ff;">
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
    .device-canvas {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      width: max-content;
    }
  </style>
</head>
<body>
  <div class="device-canvas">
    ${screensHtml}
  </div>
</body>
</html>`;

  fs.writeFileSync(outputFile, fullHtml, 'utf8');
  console.log(`Created: ${outputFile} (${files.length} screens)`);
}

// 1. Customer App (3 screens)
createCombinedMobile(
  'D:/ZEX/Ghar tak/Assets/figma/FIGMA_HTML_EXPORT/05_CUSTOMER_MOBILE_APP',
  'D:/ZEX/Ghar tak/Assets/figma/FIGMA_ROLE_ZIPS/COMBINED_CUSTOMER_APP_3_SCREENS.html',
  'Customer Mobile App Showcase'
);

// 2. Technician App (5 screens)
createCombinedMobile(
  'D:/ZEX/Ghar tak/Assets/figma/FIGMA_HTML_EXPORT/04_TECHNICIAN_MOBILE_APP',
  'D:/ZEX/Ghar tak/Assets/figma/FIGMA_ROLE_ZIPS/COMBINED_TECHNICIAN_APP_5_SCREENS.html',
  'Technician Mobile App Showcase'
);

// 3. Partner Mobile App (4 screens)
createCombinedMobile(
  'D:/ZEX/Ghar tak/Assets/figma/FIGMA_HTML_EXPORT/03_PARTNER_MOBILE_APP',
  'D:/ZEX/Ghar tak/Assets/figma/FIGMA_ROLE_ZIPS/COMBINED_PARTNER_MOBILE_APP_4_SCREENS.html',
  'Partner Mobile App Showcase'
);
