const fs = require('fs');
const path = require('path');

const inv = require('./figma_files_inventory.json');
const pngs = inv.filter(f => f.ext === '.png');

console.log(`Total PNGs: ${pngs.length}`);

// Group by top-level or subfolder
const byFolder = {};
pngs.forEach(p => {
  const parts = p.relPath.split(path.sep);
  const top = parts[0];
  byFolder[top] = (byFolder[top] || 0) + 1;
});
console.log('PNGs by top directory:', byFolder);

// Check ALL_SCREENS_FOR_FIGMA
const allScreens = pngs.filter(p => p.relPath.startsWith('ALL_SCREENS_FOR_FIGMA'));
console.log(`\nALL_SCREENS_FOR_FIGMA count: ${allScreens.length}`);
allScreens.forEach(s => console.log('  -', path.basename(s.relPath)));

// Check APP screens
const appScreens = pngs.filter(p => p.relPath.startsWith('APP'));
console.log(`\nAPP count: ${appScreens.length}`);
appScreens.forEach(s => console.log('  -', s.relPath));

// Check individual root folders
const rootFolderPngs = pngs.filter(p => !p.relPath.startsWith('ALL_SCREENS_FOR_FIGMA') && !p.relPath.startsWith('APP'));
console.log(`\nOther folder count: ${rootFolderPngs.length}`);
rootFolderPngs.forEach(s => console.log('  -', s.relPath));
