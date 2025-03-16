/**
 * Migration script to update relative imports to use path aliases
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Map of directories to their aliases
const aliasMap = {
  'src/components': '@components',
  'src/components/BidPage': '@components/BidPage',
  'src/components/shared': '@components/shared',
  'src/hooks': '@hooks',
  'src/utils': '@utils',
  'src/services': '@services',
  'src/types': '@types',
  'src/constants': '@constants',
  'src/pages': '@pages',
  'src/assets': '@assets',
  'src/styles': '@styles',
  'src/context': '@context',
  'src/store': '@store'
};

// Reverse map for lookups by directory depth
const reversedAliasMap = {};
Object.entries(aliasMap).forEach(([dir, alias]) => {
  const depth = dir.split('/').length;
  if (!reversedAliasMap[depth]) {
    reversedAliasMap[depth] = [];
  }
  reversedAliasMap[depth].push({ dir, alias });
});

// Function to find TypeScript and TSX files recursively
function findTsFiles() {
  return glob.sync('src/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', 'src/**/*.d.ts']
  });
}

// Function to determine the current file's directory depth
function getFileDepth(filePath) {
  return path.dirname(filePath).split(path.sep).length;
}

// Function to check if a path is a relative import
function isRelativeImport(importPath) {
  return importPath.startsWith('./') || importPath.startsWith('../');
}

// Function to resolve a relative path based on the current file's location
function resolveRelativePath(currentFilePath, importPath) {
  const currentDir = path.dirname(currentFilePath);
  const absolutePath = path.resolve(currentDir, importPath);
  // Normalize to relative path from project root
  return path.relative(process.cwd(), absolutePath).replace(/\\/g, '/');
}

// Function to convert a resolved path to an alias path if possible
function convertToAliasPath(resolvedPath) {
  // Sort by directory depth (deepest first) to match the most specific paths first
  const depths = Object.keys(reversedAliasMap).sort((a, b) => b - a);

  for (const depth of depths) {
    const aliasList = reversedAliasMap[depth];
    for (const { dir, alias } of aliasList) {
      // Check if the resolved path starts with the directory
      if (resolvedPath.startsWith(dir)) {
        // Replace the directory part with the alias
        const relativePath = resolvedPath.slice(dir.length);
        return `${alias}${relativePath}`;
      }
    }
  }

  // If no alias matches, return null
  return null;
}

// Function to process a single file and update its imports
function processFile(filePath) {
  console.log(`Processing ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  // Regular expression to find import statements
  // This regex captures imports like:
  // import { something } from '../path/to/module';
  // import something from './path/to/module';
  const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+[^,\s]+|[^,\s*{}]+)\s+from\s+['"]([^'"]*)['"]/g;

  // Replace relative imports with alias imports
  content = content.replace(importRegex, (match, importPath) => {
    if (isRelativeImport(importPath)) {
      const resolvedPath = resolveRelativePath(filePath, importPath);
      const aliasPath = convertToAliasPath(resolvedPath);

      if (aliasPath) {
        updated = true;
        // Replace the import path with the alias path
        return match.replace(importPath, aliasPath);
      }
    }
    return match;
  });

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  Updated ${filePath}`);
    return 1;
  }

  return 0;
}

// Main function to process all files
function migrateToAliases() {
  const tsFiles = findTsFiles();
  console.log(`Found ${tsFiles.length} TypeScript files.`);

  let updatedCount = 0;
  for (const file of tsFiles) {
    updatedCount += processFile(file);
  }

  console.log(`\nMigration complete. Updated ${updatedCount} out of ${tsFiles.length} files.`);

  if (updatedCount > 0) {
    console.log("\nNOTE: After migrating to path aliases, you may need to:");
    console.log("1. Fix any specific cases the script missed");
    console.log("2. Run 'npm install' to install the @craco/craco package");
    console.log("3. Restart your development server to apply the changes");
  }
}

// Check if we need to install glob module
try {
  require.resolve('glob');
} catch (e) {
  console.error('The "glob" package is required but not installed. Installing now...');
  require('child_process').execSync('npm install glob --no-save', { stdio: 'inherit' });
  console.log('Installed "glob" package successfully.');
}

// Run the migration
migrateToAliases();
