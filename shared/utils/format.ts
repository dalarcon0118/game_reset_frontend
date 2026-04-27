/** * Format utilities for display strings. */

/** Formats a count as a badge string: "9+" for counts > 9, otherwise the number. */ export const formatBadgeCount = (count: number): string => (count > 9 ? '9+' : String(count));