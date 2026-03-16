/**
 * Processor Module
 * Responsibility: Filter noisy messages, deduplicate, and add context (flow tags)
 */

const NOISE_TAGS = ['[Ensuring valid auth token...]', '[Preparing request config...]'];
const PROGRESS_BAR_REGEX = /[░▓]{8,}/;
const START_TRIGGER = 'Logs for your project will appear below';
const DUMP_START_TRIGGER = '📦 FULL STORAGE DUMP:';
const DUMP_END_TRIGGER = '✅ Full storage dump completed.';

// Tags that should ALWAYS be logged (high priority)
const ALWAYS_LOG_TAGS = ['NAV_EFFECT', 'ENGINE', 'CMD_CORE', 'AUTH_STORAGE_ADAPTER', 'BET_REPO', 'DRAW_REPO'];

const LAYER_MAP = {
  errors: [/ERROR/, /FATAL/, /Error:/, /Exception/],
  infra: [/CMD_CORE/, /AUTH_STORAGE_ADAPTER/, /HTTP/, /STORAGE/, /Network/],
  domain: [/ENGINE/, /DRAW_REPO/, /BET_REPO/, /MSG:/, /UPDATE:/, /MODEL:/]
};

const NOISY_STACK_PATTERNS = [
  /node_modules/,
  /node:internal/,
  /NativeModules/,
  /RCTEventEmitter/,
  /MessageQueue.js/,
  /createProxy.js/,
  /hot-patcher/
];

/**
 * Clean up stack traces to reduce token usage
 */
function sanitizeStack(line) {
  if (NOISY_STACK_PATTERNS.some(pattern => pattern.test(line))) {
    return null; // Irrelevant for business logic
  }
  return line;
}

/**
 * Check if a line contains a tag that should always be logged
 */
function hasAlwaysLogTag(line) {
  return ALWAYS_LOG_TAGS.some(tag => line.includes(tag));
}

/**
 * Identify the layer for a given log line
 */
function getLayer(line) {
  for (const [layer, patterns] of Object.entries(LAYER_MAP)) {
    if (patterns.some(p => p.test(line))) {
      return layer;
    }
  }
  return 'boot';
}

/**
 * Filter for common noisy tags
 */
function isNoise(line) {
  return NOISE_TAGS.some(tag => line.includes(tag)) || PROGRESS_BAR_REGEX.test(line);
}

/**
 * Basic deduplication for lines that repeat sequentially
 */
class LogProcessor {
  constructor() {
    this.lastLine = '';
    this.repeatCount = 0;
    this.isRecording = false; // Start recording only after trigger
    this.isDumping = false;   // Special mode for full storage dump
    this.currentView = null;
    this.currentLayer = 'boot';
  }

  /**
   * Processes a line and returns it if it's not noise/duplicate.
   * If it's a duplicate, it counts repeats.
   */
  process(line) {
    if (!line) return null;

    // Sanitization: Remove noisy stack traces
    if (sanitizeStack(line) === null) return null;

    // 0. Deduplication logic
    const cleanLine = line.trim();
    if (cleanLine === this.lastLine) {
      this.repeatCount++;
      return null; // Don't write the duplicate yet
    }

    // Reset deduplication for the new line
    const oldLastLine = this.lastLine;
    const oldRepeatCount = this.repeatCount;
    
    this.lastLine = cleanLine;
    this.repeatCount = 0;

    // Identify the layer for the manager to use
    this.currentLayer = getLayer(line);

    // Prepare prefix if there were previous duplicates
    let prefix = '';
    if (oldRepeatCount > 0) {
      prefix = `[DUPLICATE x${oldRepeatCount}] ${oldLastLine}\n`;
    }

    // Check for trigger to start recording (Mover antes de otros filtros)
    if (!this.isRecording) {
      if (line.includes(START_TRIGGER)) {
        this.isRecording = true;
        const sessionStartMsg = `--- LOG SESSION STARTED: ${new RegExp(START_TRIGGER).test(line) ? line : START_TRIGGER} ---`;
        return prefix + sessionStartMsg;
      }
      return null;
    }

    // 1. Detect view changes from NAV_EFFECT or explicit markers
    if (line.includes('🔄 VIEW:')) {
      const match = line.match(/🔄 VIEW: ([A-Z_]+)/);
      if (match && match[1]) {
        this.currentView = match[1];
        return prefix + line; // Always return the marker to ensure it's logged
      }
    }

    if (line.includes('NAV_EFFECT') && line.includes('"to":')) {
      const match = line.match(/"to":\s*"([^"]+)"/);
      if (match && match[1]) {
        this.currentView = match[1];
      }
    }

    // Always log important tags
    if (hasAlwaysLogTag(line)) {
      return prefix + line;
    }

    // Check for dump start/end
    if (line.includes(DUMP_START_TRIGGER)) {
      this.isDumping = true;
      return prefix + line; // Return it so it's also in main log
    }
    if (line.includes(DUMP_END_TRIGGER)) {
      this.isDumping = false;
      return prefix + line;
    }

    if (isNoise(line)) return null;

    return prefix + line;
  }

  /**
   * Flushes any pending repeat counts
   */
  flush() {
    if (this.repeatCount > 0) {
      return `[PREVIOUS LINE REPEATED x${this.repeatCount + 1}]\n`;
    }
    return '';
  }
}

module.exports = {
  LogProcessor,
  isNoise,
  getLayer
};
