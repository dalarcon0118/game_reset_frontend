const path = require('path');
const rotator = require('./logger/rotator');
const { LogManager } = require('./logger/manager');

// --- Configuration ---
const LOG_DIR = path.join(__dirname, '..', '..', 'a_logs');

// --- 1. Initialize Log Rotation ---
rotator.init(LOG_DIR);

// --- 2. Initialize Port Management & Log Manager ---
const manager = new LogManager(LOG_DIR);

// Clean port 8081 before starting
manager.clearPort(8081);

// --- 3. Start Project ---
const startDevPath = path.join(__dirname, '..', 'start-dev.js');
console.log('[Start] Logs will be captured in ' + LOG_DIR);

manager.run(startDevPath);
