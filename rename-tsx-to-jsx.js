// This script will help you bulk-rename all .tsx files to .jsx in your project.
// Run this in your project root with Node.js.

const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk('.', function(filePath) {
  if (filePath.endsWith('.tsx')) {
    const jsxPath = filePath.replace(/\.tsx$/, '.jsx');
    fs.renameSync(filePath, jsxPath);
    console.log(`Renamed: ${filePath} -> ${jsxPath}`);
  }
});

console.log('Bulk rename complete.');
