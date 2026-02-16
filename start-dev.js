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

// Check if ReadableStream is needed
const needsPolyfill = typeof global.ReadableStream === 'undefined';

if (!needsPolyfill) {
  console.log('ReadableStream is already defined. Starting Expo directly...');
  const child = spawn('npx', ['expo', 'start'], {
    stdio: 'inherit',
    cwd: __dirname,
    env: { 
      ...process.env, 
      EXPO_ROUTER_APP_ROOT: 'app', 
      EXPO_PROJECT_ROOT: __dirname
    }
  });

  child.on('error', (error) => {
    console.error('Failed to start Expo:', error);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code);
  });
} else {
  console.log('ReadableStream not found. Applying polyfill...');
  // Create a temporary script with the polyfill
  const tempScript = `
global.ReadableStream = global.ReadableStream || require('${path.resolve(__dirname, 'node_modules/web-streams-polyfill')}').ReadableStream;
require('child_process').spawn('npx', ['expo', 'start'], {
  stdio: 'inherit',
  cwd: '${__dirname}',
  env: { ...process.env, EXPO_ROUTER_APP_ROOT: 'app', EXPO_PROJECT_ROOT: '${__dirname}' }
});
`;

  const tempFilePath = path.join(__dirname, 'temp-start.js');
  fs.writeFileSync(tempFilePath, tempScript);

  // Run the temporary script in a new Node.js process
  const child = spawn('node', [tempFilePath], {
    stdio: 'inherit',
    cwd: __dirname,
    env: { ...process.env, EXPO_PROJECT_ROOT: __dirname }
  });

  child.on('error', (error) => {
    console.error('Failed to start Expo:', error);
    // Clean up temp file
    try {
      fs.unlinkSync(tempFilePath);
    } catch (e) {}
    process.exit(1);
  });

  child.on('exit', (code) => {
    // Clean up temp file
    try {
      fs.unlinkSync(tempFilePath);
    } catch (e) {}
    process.exit(code);
  });
}
