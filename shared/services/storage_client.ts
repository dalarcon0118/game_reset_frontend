import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const log = logger.withTag('STORAGE_CLIENT');

/**
 * Generic Storage Client for handling AsyncStorage operations with logging.
 */
export const storageClient = {
  /**
   * Saves an item to AsyncStorage.
   * Automatically stringifies objects/arrays.
   */
  async set(key: string, value: any): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
      
      log.debug(`>>> STORAGE SET: ${key}`, { value });
    } catch (error) {
      log.error(`Error saving to storage: ${key}`, error);
      throw error;
    }
  },

  /**
   * Retrieves an item from AsyncStorage.
   * Automatically parses JSON strings.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) {
        log.debug(`<<< STORAGE GET: ${key} (Not Found)`);
        return null;
      }

      let parsedValue: T;
      try {
        parsedValue = JSON.parse(value);
      } catch (e) {
        parsedValue = value as unknown as T;
      }

      log.debug(`<<< STORAGE GET: ${key}`, { value: parsedValue });
      return parsedValue;
    } catch (error) {
      log.error(`Error reading from storage: ${key}`, error);
      return null;
    }
  },

  /**
   * Removes an item from AsyncStorage.
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      log.debug(`--- STORAGE REMOVE: ${key}`);
    } catch (error) {
      log.error(`Error removing from storage: ${key}`, error);
      throw error;
    }
  },

  /**
   * Clears all items from AsyncStorage.
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
      log.info('--- STORAGE CLEAR ALL ---');
    } catch (error) {
      log.error('Error clearing storage', error);
      throw error;
    }
  },

  /**
   * Retrieves all keys currently in AsyncStorage.
   */
  async getAllKeys(): Promise<readonly string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      log.debug(`<<< STORAGE GET ALL KEYS: ${keys.length} keys found`);
      return keys;
    } catch (error) {
      log.error('Error getting all keys from storage', error);
      return [];
    }
  }
};

export default storageClient;
