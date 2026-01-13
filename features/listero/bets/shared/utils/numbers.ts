// Utility functions for number manipulation

/**
 * Splits a string into pairs of characters
 * e.g., "1234" -> ["12", "34"]
 */
export const splitStringToPairs = (input: string): string[] => {
    const pairs: string[] = [];
    for (let i = 0; i < input.length; i += 2) {
        pairs.push(input.slice(i, i + 2));
    }
    return pairs;
};

/**
 * Generates a random ID string
 */
export const generateRandomId = (): string => {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
};
