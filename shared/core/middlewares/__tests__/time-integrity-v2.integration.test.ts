import { createTimeIntegrityMiddleware } from '../time-integrity-v2.middleware';
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
  let onViolation: jest.Mock;
  let checkIntegrity: jest.Mock;

  beforeEach(() => {
    onViolation = jest.fn();
    checkIntegrity = jest.fn().mockResolvedValue({ status: 'ok' });
    middleware = createTimeIntegrityMiddleware({
      isProtected: (msg: any) =>
        msg?.type === 'SAVE_ALL_BETS' ||
        msg?.payload?.type === 'CONFIRM_SAVE_BETS',
      checkIntegrity,
      onViolation
    });
    mockModel = { auth: { status: 'AUTHENTICATED' } };
    mockMsg = { type: 'SAVE_ALL_BETS' };
    mockMeta = { traceId: 'test-trace-123' };

    jest.clearAllMocks();
  });

  const safeBeforeUpdate = async (model: any, msg: any, meta: any) => {
    if (middleware.beforeUpdate) {
      await middleware.beforeUpdate(model, msg, meta);
    }
  };

  it('should validate time integrity without side effects in beforeUpdate', async () => {
    await safeBeforeUpdate(mockModel, mockMsg, mockMeta);

    expect(mockMeta.timeIntegrityChecked).toBe(true);
    expect(checkIntegrity).toHaveBeenCalled();
  });

  it('should validate wrapped bet commit messages', async () => {
    const wrappedMsg = { type: 'LOTERIA', payload: { type: 'CONFIRM_SAVE_BETS', drawId: 'draw-1' } };

    await safeBeforeUpdate(mockModel, wrappedMsg, mockMeta);

    expect(mockMeta.timeIntegrityChecked).toBe(true);
    expect(checkIntegrity).toHaveBeenCalled();
  });

  it('should skip validation for auth-related messages', async () => {
    const authMsg = { type: 'USER_CHANGED' };

    await safeBeforeUpdate(mockModel, authMsg, mockMeta);

    expect(mockMeta.timeIntegrityChecked).toBe(true);
    expect(checkIntegrity).not.toHaveBeenCalled();
  });

  it('should validate protected messages even for expired session models', async () => {
    const expiredModel = { auth: { status: 'EXPIRED' } };

    await safeBeforeUpdate(expiredModel, mockMsg, mockMeta);

    expect(mockMeta.timeIntegrityChecked).toBe(true);
    expect(checkIntegrity).toHaveBeenCalled();
  });

  it('should skip validation for non-bet messages', async () => {
    const nonBetMsg = { type: 'FILTER_DRAWS' };

    await safeBeforeUpdate(mockModel, nonBetMsg, mockMeta);

    expect(mockMeta.timeIntegrityChecked).toBe(true);
    expect(checkIntegrity).not.toHaveBeenCalled();
  });

  it('should call onViolation when integrity returns violation', async () => {
    const violation = {
      status: 'violation' as const,
      reason: 'Time jump detected',
      violationType: 'forward_jump' as const,
      jumpMs: 60000
    };
    checkIntegrity.mockResolvedValueOnce(violation);

    await safeBeforeUpdate(mockModel, mockMsg, mockMeta);

    expect(onViolation).toHaveBeenCalledWith(violation);
    expect(mockMeta.timeIntegrityViolation).toEqual(violation);
  });

  it('should not call onViolation when integrity is ok', async () => {
    await safeBeforeUpdate(mockModel, mockMsg, mockMeta);
    expect(onViolation).not.toHaveBeenCalled();
  });

  it('should deduplicate based on traceId', async () => {
    await safeBeforeUpdate(mockModel, mockMsg, mockMeta);
    const firstCallCount = checkIntegrity.mock.calls.length;

    await safeBeforeUpdate(mockModel, mockMsg, mockMeta);
    const secondCallCount = checkIntegrity.mock.calls.length;

    expect(secondCallCount).toBe(firstCallCount);
  });
});
