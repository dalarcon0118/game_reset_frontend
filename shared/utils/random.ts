/**
 * Utility functions for generating random values and IDs.
 */

/**
 * Generates a random ID string using alphanumeric characters.
 * @returns A unique-ish random string.
 */
export const generateRandomId = (): string => {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
};
