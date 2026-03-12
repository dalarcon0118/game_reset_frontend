import { createTimeIntegrityMiddleware } from '../time-integrity-v2.middleware';
import { securityService } from '@core/core_module/services/security.service';
import { TimerRepository } from '@/shared/repositories/system/time/timer.repository';

jest.mock('@/shared/repositories/system/time/timer.repository');
jest.mock('@/shared/utils/logger', () => ({
  logger: {
    withTag: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }))
  }
}));

describe('TimeIntegrityMiddleware v2 Integration', () => {
  let middleware: ReturnType<typeof createTimeIntegrityMiddleware>;
  let mockModel: any;
  let mockMsg: any;
  let mockMeta: any;

  beforeEach(() => {
    middleware = createTimeIntegrityMiddleware();
    mockModel = { auth: { status: 'AUTHENTICATED' } };
    mockMsg = { type: 'SAVE_ALL_BETS' };
    mockMeta = { traceId: 'test-trace-123' };

    jest.clearAllMocks();
    (TimerRepository.validateIntegrity as jest.Mock).mockResolvedValue({ status: 'ok', deltaMs: 0 });
  });

  const safeBeforeUpdate = async (model: any, msg: any, meta: any) => {
    if (middleware.beforeUpdate) {
      await middleware.beforeUpdate(model, msg, meta);
    }
  };

  const safeAfterUpdate = (prevModel: any, msg: any, nextModel: any, cmd: any, meta: any) => {
    if (middleware.afterUpdate) {
      middleware.afterUpdate(prevModel, msg, nextModel, cmd, meta);
    }
  };

  it('should validate time integrity without side effects in beforeUpdate', async () => {
    await safeBeforeUpdate(mockModel, mockMsg, mockMeta);

    expect(mockMeta.timeIntegrityChecked).toBe(true);
    expect(TimerRepository.validateIntegrity).toHaveBeenCalled();
  });

  it('should validate wrapped bet commit messages', async () => {
    const wrappedMsg = { type: 'LOTERIA', payload: { type: 'CONFIRM_SAVE_BETS', drawId: 'draw-1' } };

    await safeBeforeUpdate(mockModel, wrappedMsg, mockMeta);

    expect(mockMeta.timeIntegrityChecked).toBe(true);
    expect(TimerRepository.validateIntegrity).toHaveBeenCalled();
  });

  it('should skip validation for auth-related messages', async () => {
    const authMsg = { type: 'USER_CHANGED' };

    await safeBeforeUpdate(mockModel, authMsg, mockMeta);

    expect(mockMeta.timeIntegrityChecked).toBe(true);
    expect(TimerRepository.validateIntegrity).not.toHaveBeenCalled();
  });

  it('should skip validation for expired sessions', async () => {
    const expiredModel = { auth: { status: 'EXPIRED' } };

    await safeBeforeUpdate(expiredModel, mockMsg, mockMeta);

    expect(mockMeta.timeIntegrityChecked).toBe(true);
    expect(TimerRepository.validateIntegrity).not.toHaveBeenCalled();
  });

  it('should skip validation for non-bet messages', async () => {
    const nonBetMsg = { type: 'FILTER_DRAWS' };

    await safeBeforeUpdate(mockModel, nonBetMsg, mockMeta);

    expect(mockMeta.timeIntegrityChecked).toBe(true);
    expect(TimerRepository.validateIntegrity).not.toHaveBeenCalled();
  });

  it('should handle time violations in afterUpdate', () => {
    const violation = {
      status: 'violation' as const,
      reason: 'Time jump detected',
      violationType: 'forward_jump' as const,
      jumpMs: 60000
    };

    mockMeta.timeIntegrityViolation = violation;

    const securitySpy = jest.spyOn(securityService, 'handleTimeIntegrityViolation');

    safeAfterUpdate(mockModel, mockMsg, mockModel, undefined, mockMeta);

    expect(securitySpy).toHaveBeenCalledWith(violation);
    expect(mockMeta.timeIntegrityViolation).toBeUndefined(); // Should be cleared
  });

  it('should not process violations if none detected', () => {
    mockMeta.timeIntegrityViolation = undefined;

    const securitySpy = jest.spyOn(securityService, 'handleTimeIntegrityViolation');

    safeAfterUpdate(mockModel, mockMsg, mockModel, undefined, mockMeta);

    expect(securitySpy).not.toHaveBeenCalled();
  });

  it('should deduplicate based on traceId', async () => {
    await safeBeforeUpdate(mockModel, mockMsg, mockMeta);
    const firstCallCount = (TimerRepository.validateIntegrity as jest.Mock).mock.calls.length;

    await safeBeforeUpdate(mockModel, mockMsg, mockMeta);
    const secondCallCount = (TimerRepository.validateIntegrity as jest.Mock).mock.calls.length;

    expect(secondCallCount).toBe(firstCallCount);
  });
});
