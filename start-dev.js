// Create a temporary file with the polyfill and run expo
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check for expo cache issues
const expoCachePath = path.join(__dirname, '.expo');
if (fs.existsSync(expoCachePath)) {
  try {
    console.log('Cleaning .expo cache to avoid permission issues...');
    fs.rmSync(expoCachePath, { recursive: true, force: true });
  } catch (e) {
    console.warn('Could not clean .expo cache, continuing anyway...');
  }
}

// Check for Metro cache issues in some OS-specific locations if needed
// For simplicity, we just use --clear when spawning expo
console.log('Starting Expo with --clear to avoid cache issues...');

// Check for ReadableStream is needed for older Node.js versions
if (typeof global.ReadableStream === 'undefined' && parseInt(process.versions.node.split('.')[0]) < 18) {
  try {
    global.ReadableStream = require('web-streams-polyfill').ReadableStream;
  } catch (e) {
    console.warn('Could not polyfill ReadableStream, continuing anyway...');
  }
}

console.log('Starting Expo directly...');
const args = ['expo', 'start', '--clear', ...process.argv.slice(2)];
const child = spawn('npx', args, {
  stdio: 'inherit',
  cwd: __dirname,
  env: {
    ...process.env, 
    EXPO_ROUTER_APP_ROOT: 'app', 
    EXPO_PROJECT_ROOT: __dirname,
    NODE_NO_WARNINGS: '1'
  },
  shell: true // Added shell: true for better compatibility with npx on some systems
});

child.on('error', (error) => {
  console.error('Failed to start Expo:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code);
});
