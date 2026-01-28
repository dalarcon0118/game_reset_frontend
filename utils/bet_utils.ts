export const formatParletNumbers = (numbers: string): string => {
  const pairs = [];
  for (let i = 0; i < numbers.length; i += 2) {
    if (i + 1 < numbers.length) {
      pairs.push(numbers.substring(i, i + 2));
    }
  }
  return pairs.join(' - ');
};

export const isValidBetNumbers = (
  numbers: string,
  gameTypeCode: 'fijo' | 'parlet' | 'centena' | null
): boolean => {
  if (!gameTypeCode || !numbers) return false;

  // For Fijo: 2 digits
  if (gameTypeCode === 'fijo') {
    return numbers.length === 2;
  }
  
  // For Centena: 3 digits
  if (gameTypeCode === 'centena') {
    return numbers.length === 3;
  }
  
  // For Parlet: at least 2 pairs (4 digits)
  if (gameTypeCode === 'parlet') {
    return numbers.length >= 4 && numbers.length % 2 === 0;
  }

  return false;
};

export const getMaxLength = (
  gameTypeCode: 'fijo' | 'parlet' | 'centena' | null
): number => {
  if (!gameTypeCode) return 0;
  
  if (gameTypeCode === 'fijo') return 20;
  if (gameTypeCode === 'centena') return 3;
  if (gameTypeCode === 'parlet') return 20; // Allow up to 10 pairs
  
  return 0;
};