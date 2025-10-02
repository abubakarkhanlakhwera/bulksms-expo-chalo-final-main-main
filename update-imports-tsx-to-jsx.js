// This script will help you bulk-update import paths from .tsx to .jsx in your project.
// Run this in your project root with Node.js after renaming files.

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
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    const updated = content.replace(/(from\s+['"].*?)\.tsx(['"])/g, '$1.jsx$2');
    if (content !== updated) {
      fs.writeFileSync(filePath, updated, 'utf8');
      console.log(`Updated imports in: ${filePath}`);
    }
  }
});

console.log('Import path update complete.');
