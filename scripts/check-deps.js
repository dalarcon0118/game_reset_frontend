const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const packageJsonPath = path.join(projectRoot, 'package.json');

// Folders to scan
const scanDirs = ['app', 'components', 'features', 'config', 'constants', 'data'];
// File extensions to scan
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

// Load package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const allDeps = new Set([
  ...Object.keys(packageJson.dependencies || {}),
  ...Object.keys(packageJson.devDependencies || {}),
  // Built-in React Native / Expo modules that might not be in package.json directly
  'react-native',
  'expo',
  'react',
  'react-dom'
]);

// Helper to find all files recursively
function getFiles(dir, allFiles = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.bolt') {
        getFiles(name, allFiles);
      }
    } else if (extensions.includes(path.extname(name))) {
      allFiles.push(name);
    }
  }
  return allFiles;
}

const missingDeps = new Map();

console.log('🔍 Starting dependency verification...');

scanDirs.forEach(dir => {
  const dirPath = path.join(projectRoot, dir);
  if (!fs.existsSync(dirPath)) return;

  const files = getFiles(dirPath);
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Remove comments to avoid false positives in commented out code
    const cleanContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    
    // Simple regex for static imports: import ... from 'module' or import 'module'
    const importRegex = /from\s+['"]([^'.\/][^'"]*)['"]|import\s+['"]([^'.\/][^'"]*)['"]/g;
    let match;

    while ((match = importRegex.exec(cleanContent)) !== null) {
      let moduleName = match[1] || match[2];
      
      // Handle scoped packages (@org/package) and sub-imports (module/path)
      if (moduleName.startsWith('@')) {
        const parts = moduleName.split('/');
        moduleName = `${parts[0]}/${parts[1]}`;
      } else {
        moduleName = moduleName.split('/')[0];
      }

      // Ignore aliases (e.g., @/components)
      if (moduleName.startsWith('@/')) continue;
      if (moduleName.startsWith('@shared/')) continue;
      if (moduleName.startsWith('@features/')) continue;
      if (moduleName.startsWith('@core/')) continue;

      if (!allDeps.has(moduleName)) {
        if (!missingDeps.has(moduleName)) {
          missingDeps.set(moduleName, new Set());
        }
        missingDeps.get(moduleName).add(path.relative(projectRoot, file));
      }
    }
  });
});

if (missingDeps.size > 0) {
  console.error('\n❌ Error: Missing dependencies found in source code!\n');
  missingDeps.forEach((files, dep) => {
    console.error(`Module "${dep}" is used in:`);
    files.forEach(file => console.error(`  - ${file}`));
    console.error(`Please run: npm install ${dep}\n`);
  });
  process.exit(1);
} else {
  console.log('\n✅ All dependencies are correctly listed in package.json.\n');
  process.exit(0);
}
