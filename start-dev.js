// Create a temporary file with the polyfill and run expo
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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
