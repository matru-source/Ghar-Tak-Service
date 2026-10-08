const fs = require('fs');
const path = require('path');

const rootDir = 'D:\\ZEX\\Ghar tak\\Assets\\figma';

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

const allFiles = getAllFiles(rootDir);
const summary = allFiles.map(filePath => {
  const relPath = path.relative(rootDir, filePath);
  const ext = path.extname(filePath).toLowerCase();
  const stat = fs.statSync(filePath);
  return {
    relPath,
    fullPath: filePath,
    name: path.basename(filePath),
    ext,
    sizeKb: Math.round(stat.size / 1024)
  };
});

fs.writeFileSync('scripts/figma_files_inventory.json', JSON.stringify(summary, null, 2));
console.log(`Found ${summary.length} total files in Assets/figma.`);

const exts = {};
summary.forEach(f => exts[f.ext] = (exts[f.ext] || 0) + 1);
console.log('Extensions:', exts);
