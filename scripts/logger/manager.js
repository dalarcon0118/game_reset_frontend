/**
 * Manager Module
 * Responsibility: Orchestrate child processes and stream connections
 */

const { spawn, execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { sanitize } = require('./sanitizer');
const { LogProcessor } = require('./processor');
const rotator = require('./rotator');

class LogManager {
  constructor(logStream, logDir, logFile) {
    this.logStream = logStream;
    this.logDir = logDir;
    this.logFile = logFile;
    this.processor = new LogProcessor();
    this.buffer = ''; // Accumulator for log lines
  }

  /**
   * Clears process on given port
   */
  clearPort(port) {
    try {
      console.log(`[Manager] Checking for processes on port ${port}...`);
      const stdout = execSync(`lsof -t -i:${port} 2>/dev/null`).toString();
      if (stdout.trim()) {
        const pids = stdout.trim().split('\n');
        console.log(`[Manager] Killing processes on port ${port}: ${pids.join(', ')}`);
        pids.forEach(pid => {
          try { process.kill(Number(pid), 'SIGKILL'); } catch (e) { }
        });
        spawnSync('sleep', ['1']);
      }
    } catch (e) { }
  }

  /**
   * Runs the dev command and pipes outputs
   */
  run(commandPath) {
    console.log(`[Manager] Starting project: ${commandPath}`);
    
    /**
     * We use macOS 'script' to create a PTY. 
     * -F: flush output
     * -q: quiet
     * /dev/null: we don't want script to write its own log, we handle it via pipes.
     */
    const child = spawn('script', ['-F', '-q', '/dev/null', 'node', commandPath], {
      cwd: path.join(__dirname, '..', '..'),
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    const handleData = (data) => {
      const str = data.toString();
      
      // 1. Output original to stdout AS IS (preserving PTY behavior, colors, progress bars)
      process.stdout.write(str);
      
      // 2. Detect Reloading apps to clear logs
      if (str.includes('Reloading apps')) {
        console.log('\n[Manager] "Reloading apps" detected. Clearing logs directory...');
        try {
          // 1. Close current stream
          this.logStream.end();
          
          // 2. Clear directory
          rotator.clearDirectory(this.logDir);
          
          // 3. Re-initiate stream
          this.logStream = rotator.createLogStream(this.logFile);
          console.log('[Manager] Log stream restarted successfully.');
        } catch (e) {
          console.error(`[Manager] Error during log reset: ${e.message}`);
        }
      }

      // 3. Buffer processing for the log file
      this.buffer += str;
      let lastNewlineIndex;
      
      while ((lastNewlineIndex = this.buffer.indexOf('\n')) !== -1) {
        const line = this.buffer.substring(0, lastNewlineIndex);
        this.buffer = this.buffer.substring(lastNewlineIndex + 1);
        
        const cleanLine = sanitize(line);
        if (cleanLine) {
          const wasDumping = this.processor.isDumping;
          const processedLine = this.processor.process(cleanLine);
          const isDumping = this.processor.isDumping;

          if (processedLine) {
            this.logStream.write(processedLine + '\n');

            // Handle offline storage dump to offline.log
            // Include both the line that starts the dump and the line that ends it
            if ((wasDumping || isDumping) && this.logDir) {
              const offlineLogPath = path.join(this.logDir, 'offline.log');
              fs.appendFileSync(offlineLogPath, processedLine + '\n');
            }
          }
        }
      }
    };

    child.stdout.on('data', handleData);
    child.stderr.on('data', handleData);

    child.on('error', (err) => {
      console.error(`[Manager] Failed to start process: ${err.message}`);
    });

    child.on('close', (code) => {
      // Final flush
      if (this.buffer) {
        const cleanLine = sanitize(this.buffer);
        if (cleanLine) {
          const wasDumping = this.processor.isDumping;
          const processedLine = this.processor.process(cleanLine);
          const isDumping = this.processor.isDumping;

          if (processedLine) {
            this.logStream.write(processedLine + '\n');
            if ((wasDumping || isDumping) && this.logDir) {
              const offlineLogPath = path.join(this.logDir, 'offline.log');
              fs.appendFileSync(offlineLogPath, processedLine + '\n');
            }
          }
        }
      }
      
      const flushMsg = this.processor.flush();
      if (flushMsg) this.logStream.write(flushMsg);
      
      console.log(`[Manager] Process exited with code ${code}`);
      process.exit(code);
    });

    return child;
  }
}

module.exports = {
  LogManager
};
