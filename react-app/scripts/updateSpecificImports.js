/**
 * This script updates specific high-priority import patterns
 * that are prevalent in the codebase
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Common patterns to update
const patterns = [
  {
    // "../store" to "@store"
    regex: /from\s+['"]\.\.\/store['"]/g,
    replacement: 'from \'@store\''
  },
  {
    // "../store/auctionSlice" to "@store/auctionSlice"
    regex: /from\s+['"]\.\.\/store\/([^'"]+)['"]/g,
    replacement: 'from \'@store/$1\''
  },
  {
    // "../types" to "@types"
    regex: /from\s+['"]\.\.\/types['"]/g,
    replacement: 'from \'@types\''
  },
  {
    // "../services/databaseService" to "@services/databaseService"
    regex: /from\s+['"]\.\.\/services\/([^'"]+)['"]/g,
    replacement: 'from \'@services/$1\''
  },
  {
    // "../hooks/useAuction" to "@hooks/useAuction"
    regex: /from\s+['"]\.\.\/hooks\/([^'"]+)['"]/g,
    replacement: 'from \'@hooks/$1\''
  },
  {
    // "../utils/constants" to "@utils/constants"
    regex: /from\s+['"]\.\.\/utils\/([^'"]+)['"]/g,
    replacement: 'from \'@utils/$1\''
  },
  {
    // "../components/BidHistoryTable" to "@components/BidHistoryTable"
    regex: /from\s+['"]\.\.\/components\/([^'"]+)['"]/g,
    replacement: 'from \'@components/$1\''
  }
];

// Process a single file
function processFile(filePath) {
  console.log(`Processing ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  // Apply each pattern
  patterns.forEach(pattern => {
    const originalContent = content;
    content = content.replace(pattern.regex, pattern.replacement);
    if (originalContent !== content) {
      updated = true;
    }
  });

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  Updated ${filePath}`);
    return 1;
  }

  return 0;
}

// Main function
function updateSpecificImports() {
  const tsFiles = glob.sync('src/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', 'src/**/*.d.ts']
  });

  console.log(`Found ${tsFiles.length} TypeScript files.`);

  let updatedCount = 0;
  for (const file of tsFiles) {
    updatedCount += processFile(file);
  }

  console.log(`\nUpdates complete. Updated ${updatedCount} out of ${tsFiles.length} files.`);
}

// Check if glob is installed
try {
  require.resolve('glob');
} catch (e) {
  console.error('The "glob" package is required but not installed. Installing now...');
  require('child_process').execSync('npm install glob --no-save', { stdio: 'inherit' });
  console.log('Installed "glob" package successfully.');
}

// Run the updates
updateSpecificImports();
