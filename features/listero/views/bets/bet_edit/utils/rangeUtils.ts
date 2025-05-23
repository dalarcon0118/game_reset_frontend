/**
 * Genera un rango de números continuos entre dos números
 * @param start Número inicial (dos dígitos)
 * @param end Número final (dos dígitos)
 * @returns Array de números en formato de string de dos dígitos
 */
export const generateContinuousRange = (start: string, end: string): string[] => {
  const startNum = parseInt(start, 10);
  const endNum = parseInt(end, 10);
  
  if (isNaN(startNum) || isNaN(endNum) || startNum > endNum) {
    return [];
  }
  
  const result: string[] = [];
  for (let i = startNum; i <= endNum; i++) {
    // Asegurarse de que siempre sea un string de dos dígitos
    result.push(i.toString().padStart(2, '0'));
  }
  
  return result;
};

/**
 * Genera un rango de números con el mismo terminal
 * @param start Número inicial (dos dígitos)
 * @param end Número final (dos dígitos)
 * @returns Array de números en formato de string de dos dígitos
 */
export const generateTerminalRange = (start: string, end: string): string[] => {
  const startNum = parseInt(start, 10);
  const endNum = parseInt(end, 10);
  
  if (isNaN(startNum) || isNaN(endNum)) {
    return [];
  }
  
  // Obtener el último dígito del número inicial
  const terminal = start.charAt(1);
  
  const result: string[] = [];
  for (let i = 0; i <= 9; i++) {
    const num = `${i}${terminal}`;
    result.push(num);
  }
  
  return result;
};

/**
 * Formatea un número para asegurar que tenga dos dígitos
 * @param num Número o string a formatear
 * @returns String de dos dígitos
 */
export const formatTwoDigits = (num: string | number): string => {
  if (typeof num === 'number') {
    return num.toString().padStart(2, '0');
  }
  return num.padStart(2, '0');
};