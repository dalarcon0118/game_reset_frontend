import * as Crypto from 'expo-crypto';

/**
 * Generates a SHA-256 hash of a string.
 * Used for hashing PINs/passwords before sending them to the backend.
 */
export const hashString = async (value: string): Promise<string> => {
  if (!value) return '';
  
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    value
  );
  
  return hash;
};
