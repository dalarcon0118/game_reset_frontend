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
  constructor(logDir) {
    this.logDir = logDir;
    this.processor = new LogProcessor();
    this.buffer = ''; // Accumulator for log lines
    this.viewStreams = new Map(); // Map of viewName -> writeStream
    this.layerStreams = new Map(); // Map of layerName -> writeStream
    this.aiDigestStream = null; // Stream for structured AI context
    this.contextBuffer = []; // Last 5 relevant lines (domain/msg)
    this.currentView = 'BOOT';
    this.previousView = null;

    this.initLayerStreams();
    this.initAIDigestStream();
  }

  initLayerStreams() {
    ['errors', 'infra', 'domain', 'boot'].forEach(layer => {
      const filePath = path.join(this.logDir, `${layer}.log`);
      this.layerStreams.set(layer, rotator.createLogStream(filePath));
    });
  }

  initAIDigestStream() {
    const filePath = path.join(this.logDir, 'ai_digest.jsonl');
    this.aiDigestStream = rotator.createLogStream(filePath);
  }

  /**
   * Get formatted filename for a view
   * Converts paths like /lister/bets/bolita/list to bolita.list.log
   */
  getViewFilename(viewName) {
    if (!viewName || viewName === 'BOOT') return 'boot.log';
    if (viewName === '/') return 'root.log';

    // Si es una ruta completa (empieza por /)
    if (viewName.includes('/')) {
      const segments = viewName
        .split('/')
        .filter(s => s && !/^\d+$/.test(s) && !s.includes('[') && !s.includes('('));
      
      if (segments.length > 0) {
        // Tomamos los últimos 2 segmentos significativos (ej: bolita.list)
        const relevant = segments.slice(-2);
        return `${relevant.join('.').toLowerCase()}.log`;
      }
    }

    // Mapeo de compatibilidad para nombres cortos (fallback)
    const nameMap = {
      'LOGIN': 'auth.login.log',
      'LIST': 'loteria.list.log',
      'BOLITA_LIST': 'bolita.list.log',
      'ANOTATE': 'loteria.anotate.log',
      'DASHBOARD': 'lister.dashboard.log',
      'TABS': 'lister.main.log'
    };

    if (nameMap[viewName]) return nameMap[viewName];

    // Sanitizar cualquier otro nombre para evitar caracteres de ruta
    const sanitized = viewName.replace(/[\/\\]/g, '_').toLowerCase();
    return `view_${sanitized}.log`;
  }

  /**
   * Ensures a stream for the current view exists and is active
   */
  switchViewStream(viewName) {
    // Si ya tenemos una ruta completa y nos llega un nombre corto (uppercase), ignoramos el corto
    // para mantener la precisión del nombre del archivo basado en la ruta.
    if (this.currentView.includes('/') && !viewName.includes('/') && viewName === viewName.toUpperCase()) {
      return;
    }

    if (this.currentView === viewName && this.viewStreams.has(viewName)) return;

    console.log(`\n[Manager] Switching view: ${this.currentView} -> ${viewName}`);
    
    this.previousView = this.currentView;
    this.currentView = viewName;

    const fileName = this.getViewFilename(viewName);
    const filePath = path.join(this.logDir, fileName);

    // Close and remove old stream if it exists to overwrite
    if (this.viewStreams.has(viewName)) {
      this.viewStreams.get(viewName).end();
    }

    // Create new stream with 'w' flag to clear previous content
    const stream = rotator.createLogStream(filePath, 'w');
    this.viewStreams.set(viewName, stream);
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
          // 1. Close current streams
          this.viewStreams.forEach(stream => stream.end());
          this.viewStreams.clear();
          this.layerStreams.forEach(stream => stream.end());
          this.layerStreams.clear();
          if (this.aiDigestStream) this.aiDigestStream.end();
          
          // 2. Clear directory
          rotator.clearDirectory(this.logDir);
          
          // 3. Re-initiate streams
          this.initLayerStreams();
          this.initAIDigestStream();
          this.currentView = 'BOOT';
          this.processor.currentView = null;
          console.log('[Manager] Log streams restarted successfully.');
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
          // Intercept both NAV_EFFECT and explicit markers
          if (cleanLine.includes('🔄 VIEW:')) {
            const match = cleanLine.match(/🔄 VIEW: ([A-Z_]+)/);
            if (match && match[1]) {
              this.switchViewStream(match[1]);
            }
          }

          if (cleanLine.includes('NAV_EFFECT') && (cleanLine.includes('Navigating to:') || cleanLine.includes('Navigated from'))) {
            const pathMatch = cleanLine.match(/Navigating to: ([^\s,{}]+)/) || cleanLine.match(/to ([^\s,{}]+)/);
            if (pathMatch && pathMatch[1]) {
              this.switchViewStream(pathMatch[1]);
            }
          }

          const processedLine = this.processor.process(cleanLine);
          const isDumping = this.processor.isDumping;

          if (processedLine) {
          // 1. Write to Layer Log (Classification)
          const layer = this.processor.currentLayer || 'boot';
          const layerStream = this.layerStreams.get(layer);
          if (layerStream) {
            layerStream.write(processedLine + '\n');
          }

          // 2. AI Digest & Context Management
          if (layer === 'domain' || cleanLine.includes('MSG:')) {
            this.contextBuffer.push(cleanLine);
            if (this.contextBuffer.length > 5) this.contextBuffer.shift();
          }

          if (layer === 'errors') {
            const digest = {
              ts: new Date().toISOString(),
              error: cleanLine,
              view: this.currentView,
              context: this.contextBuffer
            };
            this.aiDigestStream.write(JSON.stringify(digest) + '\n');
          }

          // 3. Handle view-specific logs (Classification by navigation)
          if (this.processor.currentView) {
            this.switchViewStream(this.processor.currentView);
          } else if (this.currentView === 'BOOT') {
            this.switchViewStream('BOOT');
          }

          const currentViewStream = this.viewStreams.get(this.currentView);
          if (currentViewStream) {
            currentViewStream.write(processedLine + '\n');
          }

          // 4. Handle offline storage dump to offline.log
          if (isDumping && this.logDir) {
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
            // 1. Write to Layer Log (Classification)
            const layer = this.processor.currentLayer || 'boot';
            const layerStream = this.layerStreams.get(layer);
            if (layerStream) {
              layerStream.write(processedLine + '\n');
            }

            // 2. AI Digest & Context Management
            if (layer === 'domain' || cleanLine.includes('MSG:')) {
              this.contextBuffer.push(cleanLine);
              if (this.contextBuffer.length > 5) this.contextBuffer.shift();
            }

            if (layer === 'errors') {
              const digest = {
                ts: new Date().toISOString(),
                error: cleanLine,
                view: this.currentView,
                context: this.contextBuffer
              };
              this.aiDigestStream.write(JSON.stringify(digest) + '\n');
            }

            // 3. Handle view-specific logs (Classification by navigation)
            if (this.processor.currentView) {
              this.switchViewStream(this.processor.currentView);
            } else if (this.currentView === 'BOOT') {
              this.switchViewStream('BOOT');
            }

            const currentViewStream = this.viewStreams.get(this.currentView);
            if (currentViewStream) {
              currentViewStream.write(processedLine + '\n');
            }

            // 4. Handle offline storage dump to offline.log
            if (isDumping && this.logDir) {
              const offlineLogPath = path.join(this.logDir, 'offline.log');
              fs.appendFileSync(offlineLogPath, processedLine + '\n');
            }
          }
        }
      }
      
      const flushMsg = this.processor.flush();
      if (flushMsg) {
        const layer = this.processor.currentLayer || 'boot';
        const layerStream = this.layerStreams.get(layer);
        if (layerStream) layerStream.write(flushMsg);
      }
      
      console.log(`[Manager] Process exited with code ${code}`);
      process.exit(code);
    });

    return child;
  }
}

module.exports = {
  LogManager
};
