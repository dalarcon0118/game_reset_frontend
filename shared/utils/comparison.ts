/**
 * Performs a deep equality check between two values.
 * optimized for JSON-like objects (primitives, arrays, plain objects).
 * 
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns boolean - True if values are deeply equal, false otherwise
 */
export function isDeepEqual(a: any, b: any): boolean {
  // 1. Strict equality check (covers primitives and same reference)
  if (a === b) return true;

  // 2. Check for null/undefined (since typeof null is 'object')
  if (a === null || b === null || a === undefined || b === undefined) {
    return a === b;
  }

  // 3. Check for different types
  if (typeof a !== typeof b) return false;

  // 4. Handle Date objects
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // 5. Handle Arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isDeepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // 6. Handle Objects
  if (typeof a === 'object' && typeof b === 'object') {
    // Check if they are plain objects (not null, which is handled above)
    // and ensuring they have the same constructor (e.g. not comparing a Map with a plain object)
    if (a.constructor !== b.constructor) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!isDeepEqual(a[key], b[key])) return false;
    }

    return true;
  }

  // 7. Fallback (should be covered by strict equality, but for safety)
  return false;
}
