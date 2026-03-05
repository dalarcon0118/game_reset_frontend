/**
 * Sanitizer Module
 * Responsibility: Clean input streams from noise (ANSI, QR, excessive line length)
 */

const ANSI_REGEX = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
const NOBRIDGE_PREFIX = /^(\(NOBRIDGE\)\s+)?LOG\s+/i;
const QR_BLOCK_REGEX = /[█▄▀▓░]{10,}/;
const MAX_LINE_LENGTH = 2000;

/**
 * Strips ANSI escape codes from a string
 */
function stripAnsi(str) {
  return typeof str === 'string' ? str.replace(ANSI_REGEX, '') : str;
}

/**
 * Checks if a line contains QR code blocks
 */
function isQR(line) {
  return QR_BLOCK_REGEX.test(line);
}

/**
 * Truncates lines that are too long to prevent log bloat
 */
function truncate(line) {
  if (line.length > MAX_LINE_LENGTH) {
    return line.substring(0, MAX_LINE_LENGTH) + '... [TRUNCATED]';
  }
  return line;
}

/**
 * Main sanitize function
 * Returns null if the line should be completely ignored
 */
function sanitize(line) {
  if (!line || typeof line !== 'string') return '';
  
  let clean = stripAnsi(line).trim();
  
  // Remove (NOBRIDGE) LOG prefixes added by React Native environment
  clean = clean.replace(NOBRIDGE_PREFIX, '');
  
  // Ignore QR codes and empty lines after stripping
  if (!clean || isQR(clean)) return null;
  
  return truncate(clean);
}

module.exports = {
  stripAnsi,
  isQR,
  truncate,
  sanitize
};
