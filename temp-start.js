
global.ReadableStream = global.ReadableStream || require('/Users/davidmartinez/develop/Active-projects/game_reset/frontend/node_modules/web-streams-polyfill').ReadableStream;
require('child_process').spawn('npx', ['expo', 'start'], {
  stdio: 'inherit',
  cwd: '/Users/davidmartinez/develop/Active-projects/game_reset/frontend',
  env: { ...process.env, EXPO_ROUTER_APP_ROOT: 'app', EXPO_PROJECT_ROOT: '/Users/davidmartinez/develop/Active-projects/game_reset/frontend' }
});
