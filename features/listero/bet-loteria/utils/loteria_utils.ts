/**
 * Formats a loteria number into groups of 2 digits from right to left.
 * Example: "12345" -> ["1", "23", "45"]
 */
export const getLoteriaGroups = (num: number | string): string[] => {
    const s = String(num);
    if (!s || !/^\d+$/.test(s)) return [];
    
    // Formato (X)-(XX)-(XX) agrupando de derecha a izquierda
    const reversed = s.split('').reverse().join('');
    const matches = reversed.match(/.{1,2}/g);
    if (!matches) return [s];
    
    return matches.map(m => m.split('').reverse().join('')).reverse();
};
