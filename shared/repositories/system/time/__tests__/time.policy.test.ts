import { TimePolicy } from '../time.policy';
import { TimeMetadata } from '../time.types';

describe('TimePolicy', () => {
    const maxJumpMs = 5 * 60 * 1000; // 5 min
    const maxBackwardMs = 2000;      // 2 sec

    test('computeOffset should return correct difference', () => {
        const serverNow = 10000;
        const clientNow = 8000;
        expect(TimePolicy.computeOffset(serverNow, clientNow)).toBe(2000);
    });

    test('detectBackward should return true if current is significantly less than last', () => {
        const lastClient = 10000;
        const currentClient = 7000; // 3 sec backward
        expect(TimePolicy.detectBackward(lastClient, currentClient, maxBackwardMs)).toBe(true);
    });

    test('detectBackward should return false if within threshold', () => {
        const lastClient = 10000;
        const currentClient = 9500; // 0.5 sec backward, within 2s threshold
        expect(TimePolicy.detectBackward(lastClient, currentClient, maxBackwardMs)).toBe(false);
    });

    test('detectJump should return true if gap is larger than maxJumpMs', () => {
        const lastClient = 10000;
        const currentClient = 10000 + maxJumpMs + 1000;
        expect(TimePolicy.detectJump(lastClient, currentClient, maxJumpMs)).toBe(true);
    });

    test('evaluateIntegrity should return ok when no metadata exists', () => {
        const result = TimePolicy.evaluateIntegrity(20000, null, { maxJumpMs, maxBackwardMs });
        expect(result.status).toBe('ok');
    });

    test('evaluateIntegrity should return backward status on clock manipulation', () => {
        const metadata: TimeMetadata = {
            lastServerTime: 15000,
            lastClientTime: 10000,
            serverTimeOffset: 5000,
            lastSyncAt: 10000
        };
        const currentClient = 7000; // 3 sec backward
        const result = TimePolicy.evaluateIntegrity(currentClient, metadata, { maxJumpMs, maxBackwardMs });
        expect(result.status).toBe('backward');
    });

    test('getTrustedNow should apply offset correctly', () => {
        const currentClient = 10000;
        const offset = 5000;
        expect(TimePolicy.getTrustedNow(currentClient, offset)).toBe(15000);
    });
});
