const { spawn, execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'frontend.log');
const MAX_LOG_FILES = 3;

// --- Log Rotation (runs on every startup) ---
function rotateLogs() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  if (fs.existsSync(LOG_FILE)) {
    console.log('Log rotation: archiving previous session log...');

    // Shift archives: .2 -> .3, .1 -> .2, then current -> .1
    for (let i = MAX_LOG_FILES - 1; i >= 1; i--) {
      const oldPath = LOG_FILE + '.' + i;
      const newPath = LOG_FILE + '.' + (i + 1);
      if (fs.existsSync(oldPath)) {
        if (i + 1 > MAX_LOG_FILES) {
          fs.unlinkSync(oldPath); // Drop archives beyond the limit
        } else {
          fs.renameSync(oldPath, newPath);
        }
      }
    }

    fs.renameSync(LOG_FILE, LOG_FILE + '.1');
    console.log('Previous log archived to frontend.log.1');
  }
}

// --- Port Management ---
function clearPort(port) {
  try {
    console.log('Checking for processes on port ' + port + '...');
    const stdout = execSync('lsof -t -i:' + port + ' 2>/dev/null').toString();
    if (stdout.trim()) {
      const pids = stdout.trim().split('\n');
      console.log('Killing processes on port ' + port + ': ' + pids.join(', '));
      pids.forEach(function (pid) {
        try { process.kill(Number(pid), 'SIGKILL'); } catch (e) { }
      });
      // Give the OS a moment to free the port
      spawnSync('sleep', ['1']);
    }
  } catch (e) {
    // Port is likely already free
  }
}

// Run rotation and port cleanup before starting
rotateLogs();
clearPort(8081);

const startDevPath = path.join(__dirname, '..', 'start-dev.js');
console.log('Starting project. Logs will be captured in ' + LOG_FILE);

/**
 * We use the macOS 'script' command to create a pseudo-TTY (PTY).
 * This makes Expo think it is running in a real interactive terminal,
 * which preserves the interactive menu and prevents it from going
 * into non-interactive / frozen mode.
 *
 * Flags:
 *   -F  Flush output after each write (allows `tail -f` to work)
 *   -q  Quiet mode (suppress the "Script started/done" messages)
 *   LOG_FILE  Destination file for the captured output
 */
const child = spawn(
  'script',
  ['-F', '-q', LOG_FILE, 'node', startDevPath],
  {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  }
);

child.on('error', function (err) {
  console.error('Failed to start process: ' + err.message);
});

child.on('close', function (code) {
  console.log('Process exited with code ' + code);
  process.exit(code);
});
