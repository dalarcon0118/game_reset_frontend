import { StorageJanitor } from '../janitor';
import { StoragePort, ClockPort, EventBusPort, StorageEnvelope, DomainEvent } from '../../types';
import { Cleanup } from '../criteria';

describe('StorageJanitor', () => {
  let mockStorage: jest.Mocked<StoragePort>;
  let mockClock: jest.Mocked<ClockPort>;
  let mockEvents: jest.Mocked<EventBusPort>;
  let janitor: StorageJanitor;

  beforeEach(() => {
    mockStorage = {
      get: jest.fn(),
      set: jest.fn(),
      setMulti: jest.fn(),
      remove: jest.fn(),
      removeMulti: jest.fn(),
      getAllKeys: jest.fn(),
      clear: jest.fn()
    };
    mockClock = {
      now: jest.fn().mockReturnValue(10000),
      iso: jest.fn().mockReturnValue('2026-03-02T10:00:00Z')
    };
    mockEvents = {
      publish: jest.fn(),
      subscribe: jest.fn()
    };

    janitor = new StorageJanitor({
      storage: mockStorage,
      clock: mockClock,
      events: mockEvents
    });
  });

  const mockEnvelope = (timestamp: number, data: any = {}): StorageEnvelope<any> => ({
    data,
    metadata: {
      version: 'v2',
      timestamp
    }
  });

  it('should process keys and remove items that match predicate', async () => {
    const keys = ['key1', 'key2', 'key3'];
    mockStorage.getAllKeys.mockResolvedValue(keys);

    // key1 and key2 should be removed (older than 5000)
    mockStorage.get.mockImplementation(async (key) => {
      if (key === 'key1') return mockEnvelope(2000);
      if (key === 'key2') return mockEnvelope(4000);
      if (key === 'key3') return mockEnvelope(8000);
      return null;
    });

    const predicate = Cleanup.olderThan(5000, 10000);
    const result = await janitor.clean(predicate);

    expect(result.keysProcessed).toBe(3);
    expect(result.keysRemoved).toBe(2);
    expect(mockStorage.removeMulti).toHaveBeenCalledWith(['key1', 'key2']);
    expect(mockStorage.remove).not.toHaveBeenCalledWith('key3');
  });

  it('should filter by pattern if provided in options', async () => {
    const keys = ['draw:1', 'draw:2', 'user:info'];
    mockStorage.getAllKeys.mockResolvedValue(keys);
    mockStorage.get.mockResolvedValue(mockEnvelope(2000));

    const predicate = Cleanup.olderThan(5000, 10000);
    const result = await janitor.clean(predicate, { pattern: 'draw:*' });

    expect(result.keysProcessed).toBe(2);
    expect(result.keysRemoved).toBe(2);
    expect(mockStorage.removeMulti).toHaveBeenCalledWith(['draw:1', 'draw:2']);
    expect(mockStorage.remove).not.toHaveBeenCalledWith('user:info');
  });

  it('should publish events for each removal and maintenance completion', async () => {
    mockStorage.getAllKeys.mockResolvedValue(['key1']);
    mockStorage.get.mockResolvedValue(mockEnvelope(2000));

    const predicate = Cleanup.olderThan(5000, 10000);
    await janitor.clean(predicate);

    expect(mockEvents.publish).toHaveBeenCalledWith(expect.objectContaining({
      type: 'ENTITY_REMOVED',
      entity: 'key1'
    }));

    expect(mockEvents.publish).toHaveBeenCalledWith(expect.objectContaining({
      type: 'MAINTENANCE_COMPLETED',
      entity: 'storage',
      payload: expect.objectContaining({
        removed: 1,
        processed: 1
      })
    }));
  });

  it('should not publish removal events if silent is true', async () => {
    mockStorage.getAllKeys.mockResolvedValue(['key1']);
    mockStorage.get.mockResolvedValue(mockEnvelope(2000));

    const predicate = Cleanup.olderThan(5000, 10000);
    await janitor.clean(predicate, { silent: true });

    expect(mockEvents.publish).not.toHaveBeenCalledWith(expect.objectContaining({
      type: 'ENTITY_REMOVED'
    }));

    // Should still publish maintenance completion
    expect(mockEvents.publish).toHaveBeenCalledWith(expect.objectContaining({
      type: 'MAINTENANCE_COMPLETED'
    }));
  });

  it('should record errors but continue processing', async () => {
    mockStorage.getAllKeys.mockResolvedValue(['key1', 'key2']);
    mockStorage.get.mockImplementation(async (key) => {
      if (key === 'key1') throw new Error('Storage error');
      return mockEnvelope(2000);
    });

    const predicate = Cleanup.olderThan(5000, 10000);
    const result = await janitor.clean(predicate);

    expect(result.keysProcessed).toBe(2);
    expect(result.keysRemoved).toBe(1);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0]).toEqual({ key: 'key1', error: 'Storage error' });
  });

  it('should fallback to remove one by one when removeMulti fails', async () => {
    mockStorage.getAllKeys.mockResolvedValue(['key1', 'key2']);
    mockStorage.get.mockResolvedValue(mockEnvelope(2000));
    mockStorage.removeMulti.mockRejectedValue(new Error('Batch remove failed'));

    const predicate = Cleanup.olderThan(5000, 10000);
    const result = await janitor.clean(predicate, { batchSize: 10 });

    expect(result.keysProcessed).toBe(2);
    expect(result.keysRemoved).toBe(2);
    expect(mockStorage.remove).toHaveBeenCalledWith('key1');
    expect(mockStorage.remove).toHaveBeenCalledWith('key2');
  });

  it('should use iterateKeys when storage adapter provides it', async () => {
    mockStorage.iterateKeys = jest.fn(async function* () {
      yield 'draw:1';
      yield 'draw:2';
    });
    mockStorage.get.mockResolvedValue(mockEnvelope(2000));

    const predicate = Cleanup.olderThan(5000, 10000);
    const result = await janitor.clean(predicate, { pattern: 'draw:*', batchSize: 1 });

    expect(result.keysProcessed).toBe(2);
    expect(result.keysRemoved).toBe(2);
    expect(mockStorage.iterateKeys).toHaveBeenCalledWith('draw:*');
    expect(mockStorage.getAllKeys).not.toHaveBeenCalled();
    expect(mockStorage.removeMulti).toHaveBeenNthCalledWith(1, ['draw:1']);
    expect(mockStorage.removeMulti).toHaveBeenNthCalledWith(2, ['draw:2']);
  });

  it('should use getMulti when storage adapter provides it', async () => {
    mockStorage.getAllKeys.mockResolvedValue(['key1', 'key2', 'key3']);
    mockStorage.getMulti = jest.fn()
      .mockResolvedValueOnce([
        mockEnvelope(2000),
        mockEnvelope(4000)
      ])
      .mockResolvedValueOnce([
        mockEnvelope(9000)
      ]);

    const predicate = Cleanup.olderThan(5000, 10000);
    const result = await janitor.clean(predicate, { batchSize: 2 });

    expect(result.keysProcessed).toBe(3);
    expect(result.keysRemoved).toBe(2);
    expect(mockStorage.getMulti).toHaveBeenCalledWith(['key1', 'key2']);
    expect(mockStorage.getMulti).toHaveBeenCalledWith(['key3']);
    expect(mockStorage.get).not.toHaveBeenCalled();
  });

  it('should fallback to single get when getMulti fails', async () => {
    mockStorage.getAllKeys.mockResolvedValue(['key1', 'key2']);
    mockStorage.getMulti = jest.fn().mockRejectedValue(new Error('Multi get failed'));
    mockStorage.get.mockResolvedValue(mockEnvelope(2000));

    const predicate = Cleanup.olderThan(5000, 10000);
    const result = await janitor.clean(predicate, { batchSize: 10 });

    expect(result.keysProcessed).toBe(2);
    expect(result.keysRemoved).toBe(2);
    expect(mockStorage.get).toHaveBeenCalledWith('key1');
    expect(mockStorage.get).toHaveBeenCalledWith('key2');
  });
});
