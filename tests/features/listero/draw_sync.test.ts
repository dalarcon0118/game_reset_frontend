import { DrawService } from '@/shared/services/draw';
import { DrawApi } from '@/shared/services/draw/api';
import { OfflineStorage } from '@/shared/services/offline_storage';
import { storageClient } from '@/shared/services/storage_client';

// Mock dependencies
jest.mock('@/shared/services/draw/api');
// Do NOT mock OfflineStorage, we want to test its integration
// jest.mock('@/shared/services/offline_storage');

// Mock storageClient
jest.mock('@/shared/services/storage_client', () => {
  const mockStorageClient = {
    set: jest.fn(),
    get: jest.fn(),
    remove: jest.fn(),
  };
  return {
    storageClient: mockStorageClient,
    default: mockStorageClient,
    __esModule: true,
  };
});

jest.mock('@/shared/utils/logger', () => {
  const mockLogger = {
    withTag: () => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    }),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  return {
    logger: mockLogger,
    default: mockLogger,
    __esModule: true,
  };
});

describe('Draw Synchronization Flow', () => {
  const mockDraws: any[] = [
    {
      id: '1',
      name: 'Morning Draw',
      status: 'open',
      closing_time: '12:00',
      lottery: { id: 'l1', name: 'Lottery 1' },
    },
    {
      id: '2',
      name: 'Evening Draw',
      status: 'closed',
      closing_time: '18:00',
      lottery: { id: 'l2', name: 'Lottery 2' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Integration', () => {
    it('should fetch draws from API and save to local storage on success', async () => {
      // Setup mocks
      (DrawApi.list as jest.Mock).mockResolvedValue(mockDraws);
      (storageClient.set as jest.Mock).mockResolvedValue(undefined);

      // Execute
      const result = await DrawService.list({ owner_structure: '123' });

      // Verify API call
      expect(DrawApi.list).toHaveBeenCalledWith({ owner_structure: '123' });

      // Verify Storage save (OfflineStorage calling storageClient)
      // We expect the LAST_DRAWS_KEY to be used. We don't know the exact key string here easily without importing it or checking code, 
      // but we know it saves an object with data and timestamp.
      expect(storageClient.set).toHaveBeenCalledWith(
        expect.stringContaining('last_draws'),
        expect.objectContaining({
          data: mockDraws,
          timestamp: expect.any(Number)
        })
      );

      // Verify result mapping
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
      }
    });

    it('should fall back to offline storage when API fails', async () => {
      // Setup mocks
      (DrawApi.list as jest.Mock).mockRejectedValue(new Error('Network Error'));

      // Mock storage to return valid cached data (today)
      (storageClient.get as jest.Mock).mockResolvedValue({
        data: mockDraws,
        timestamp: Date.now() // Today
      });

      // Execute
      const result = await DrawService.list({ owner_structure: '123' });

      // Verify API call
      expect(DrawApi.list).toHaveBeenCalledWith({ owner_structure: '123' });

      // Verify Fallback to Storage
      expect(storageClient.get).toHaveBeenCalledWith(expect.stringContaining('last_draws'));

      // Verify result
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
      }
    });
  });

  describe('Daily Cache Validation', () => {
    it('should return cached draws if timestamp is today', async () => {
      // Setup mock
      (storageClient.get as jest.Mock).mockResolvedValue({
        data: mockDraws,
        timestamp: Date.now()
      });

      // Execute
      const result = await OfflineStorage.getLastDraws();

      // Verify
      expect(result).toEqual(mockDraws);
      expect(storageClient.remove).not.toHaveBeenCalled();
    });

    it('should clear cache and return null if timestamp is yesterday', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Setup mock
      (storageClient.get as jest.Mock).mockResolvedValue({
        data: mockDraws,
        timestamp: yesterday.getTime()
      });

      // Execute
      const result = await OfflineStorage.getLastDraws();

      // Verify
      expect(result).toBeNull();
      expect(storageClient.remove).toHaveBeenCalledWith(expect.stringContaining('last_draws'));
    });
  });
});
