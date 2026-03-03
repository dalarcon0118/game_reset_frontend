import { Cleanup } from '../criteria';
import { StorageEnvelope } from '../../types';

describe('Cleanup Criteria', () => {
  const mockEnvelope = (timestamp: number, expiresAt?: number): StorageEnvelope<any> => ({
    data: { id: 1 },
    metadata: {
      version: 'v2',
      timestamp,
      expiresAt
    }
  });

  describe('olderThan', () => {
    it('should return true if envelope is older than threshold', () => {
      const now = 10000;
      const threshold = 5000;
      const envelope = mockEnvelope(2000); // age = 8000
      
      const predicate = Cleanup.olderThan(threshold, now);
      expect(predicate(envelope, 'key')).toBe(true);
    });

    it('should return false if envelope is newer than threshold', () => {
      const now = 10000;
      const threshold = 5000;
      const envelope = mockEnvelope(8000); // age = 2000
      
      const predicate = Cleanup.olderThan(threshold, now);
      expect(predicate(envelope, 'key')).toBe(false);
    });
  });

  describe('expired', () => {
    it('should return true if envelope has expired', () => {
      const now = 10000;
      const envelope = mockEnvelope(5000, 8000); // expiresAt < now
      
      const predicate = Cleanup.expired(now);
      expect(predicate(envelope, 'key')).toBe(true);
    });

    it('should return false if envelope has not expired', () => {
      const now = 10000;
      const envelope = mockEnvelope(5000, 12000); // expiresAt > now
      
      const predicate = Cleanup.expired(now);
      expect(predicate(envelope, 'key')).toBe(false);
    });

    it('should return false if envelope has no expiration', () => {
      const now = 10000;
      const envelope = mockEnvelope(5000);
      
      const predicate = Cleanup.expired(now);
      expect(predicate(envelope, 'key')).toBe(false);
    });
  });

  describe('where', () => {
    it('should use custom logic', () => {
      const envelope = mockEnvelope(5000);
      envelope.data.status = 'synced';
      
      const predicate = Cleanup.where<any>((env) => env.data.status === 'synced');
      expect(predicate(envelope, 'key')).toBe(true);
    });
  });

  describe('composition', () => {
    it('should support OR composition with any()', () => {
      const now = 10000;
      const expired = Cleanup.expired(now);
      const older = Cleanup.olderThan(5000, now);
      const composite = Cleanup.any(expired, older);

      // Case 1: Only expired
      expect(composite(mockEnvelope(8000, 9000), 'k')).toBe(true);
      // Case 2: Only older
      expect(composite(mockEnvelope(2000), 'k')).toBe(true);
      // Case 3: Neither
      expect(composite(mockEnvelope(8000, 12000), 'k')).toBe(false);
    });

    it('should support AND composition with all()', () => {
      const now = 10000;
      const expired = Cleanup.expired(now);
      const older = Cleanup.olderThan(5000, now);
      const composite = Cleanup.all(expired, older);

      // Case 1: Both
      expect(composite(mockEnvelope(2000, 9000), 'k')).toBe(true);
      // Case 2: Only one
      expect(composite(mockEnvelope(2000, 12000), 'k')).toBe(false);
    });
  });
});
