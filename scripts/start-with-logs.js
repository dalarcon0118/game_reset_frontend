const path = require('path');
const rotator = require('./logger/rotator');
const { LogManager } = require('./logger/manager');

// --- Configuration ---
const LOG_DIR = path.join(__dirname, '..', '..', 'a_logs');
const LOG_FILE = path.join(LOG_DIR, 'frontend.log');

// --- 1. Initialize Log Rotation ---
rotator.init(LOG_DIR, LOG_FILE);

// --- 2. Initialize Port Management & Log Stream ---
const logStream = rotator.createLogStream(LOG_FILE);
const manager = new LogManager(logStream, LOG_DIR, LOG_FILE);

// Clean port 8081 before starting
manager.clearPort(8081);

// --- 3. Start Project ---
const startDevPath = path.join(__dirname, '..', 'start-dev.js');
console.log('[Start] Logs will be captured in ' + LOG_FILE);

manager.run(startDevPath);
