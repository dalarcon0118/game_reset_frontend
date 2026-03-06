/**
 * Rotator Module
 * Responsibility: File system management for logs (session rotation, cleanup)
 */

const fs = require('fs');
const path = require('path');

const MAX_LOG_FILES = 5;

/**
 * Initializes log directory and rotates existing session logs
 */
function init(logDir, logFile) {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Rotate main log file
  rotateFile(logFile);
  
  // Rotate offline log file if it exists
  const offlineLog = path.join(logDir, 'offline.log');
  rotateFile(offlineLog);
}

function rotateFile(filePath) {
  if (fs.existsSync(filePath)) {
    console.log(`[Rotator] Archiving previous ${path.basename(filePath)}...`);

    // Shift archives: .4 -> .5, .3 -> .4, etc.
    for (let i = MAX_LOG_FILES - 1; i >= 1; i--) {
      const oldPath = filePath + '.' + i;
      const newPath = filePath + '.' + (i + 1);
      
      if (fs.existsSync(oldPath)) {
        if (i + 1 > MAX_LOG_FILES) {
          fs.unlinkSync(oldPath); // Drop archives beyond the limit
        } else {
          fs.renameSync(oldPath, newPath);
        }
      }
    }

    fs.renameSync(filePath, filePath + '.1');
    console.log(`[Rotator] Previous ${path.basename(filePath)} archived to ${path.basename(filePath)}.1`);
  }
}

/**
 * Creates a WriteStream for the log file
 */
function createLogStream(logFile) {
  return fs.createWriteStream(logFile, { flags: 'a' });
}

/**
 * Clears all log files in the directory
 */
function clearDirectory(logDir) {
  if (fs.existsSync(logDir)) {
    console.log(`[Rotator] Clearing all logs in ${logDir}...`);
    const files = fs.readdirSync(logDir);
    files.forEach(file => {
      const filePath = path.join(logDir, file);
      try {
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.error(`[Rotator] Failed to delete ${file}: ${e.message}`);
      }
    });
  }
}

module.exports = {
  init,
  createLogStream,
  clearDirectory
};
