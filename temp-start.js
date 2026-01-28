
global.ReadableStream = global.ReadableStream || require('/Users/davidmartinez/develop/Experimental-sandbox/game-development/game-reset/demos/Game-Reset/frontend/node_modules/web-streams-polyfill').ReadableStream;
require('child_process').spawn('npx', ['expo', 'start'], {
  stdio: 'inherit',
  cwd: '/Users/davidmartinez/develop/Experimental-sandbox/game-development/game-reset/demos/Game-Reset/frontend',
  env: { ...process.env, EXPO_ROUTER_APP_ROOT: 'app', EXPO_PROJECT_ROOT: '/Users/davidmartinez/develop/Experimental-sandbox/game-development/game-reset/demos/Game-Reset/frontend' }
});
