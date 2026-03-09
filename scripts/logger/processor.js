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

/**
 * Check if a line contains a tag that should always be logged
 */
function hasAlwaysLogTag(line) {
  return ALWAYS_LOG_TAGS.some(tag => line.includes(tag));
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
  }

  /**
   * Processes a line and returns it if it's not noise/duplicate.
   * If it's a duplicate, it counts repeats.
   */
  process(line) {
    if (!line) return null;

    // 1. Detect view changes from NAV_EFFECT
    if (line.includes('NAV_EFFECT') && line.includes('"to":')) {
      const match = line.match(/"to":\s*"([^"]+)"/);
      if (match && match[1]) {
        this.currentView = match[1];
      }
    }

    // Always log important tags
    if (hasAlwaysLogTag(line)) {
      return line;
    }

    // Check for dump start/end
    if (line.includes(DUMP_START_TRIGGER)) {
      this.isDumping = true;
      return line; // Return it so it's also in main log
    }
    if (line.includes(DUMP_END_TRIGGER)) {
      this.isDumping = false;
      return line;
    }

    // Check for trigger to start recording
    if (!this.isRecording) {
      if (line.includes(START_TRIGGER)) {
        this.isRecording = true;
        return `--- LOG SESSION STARTED: ${new RegExp(START_TRIGGER).test(line) ? line : START_TRIGGER} ---`;
      }
      return null;
    }

    if (isNoise(line)) return null;

    if (line === this.lastLine) {
      this.repeatCount++;
      return null;
    }

    let result = '';
    if (this.repeatCount > 0) {
      result = `[PREVIOUS LINE REPEATED x${this.repeatCount + 1}]\n`;
    }

    this.repeatCount = 0;
    this.lastLine = line;

    return result + line;
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
  isNoise
};
