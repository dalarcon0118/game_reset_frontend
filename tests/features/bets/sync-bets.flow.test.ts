import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockStorage = {
    updateStatus: jest.fn(),
    getPending: jest.fn(),
    getAllRawBets: jest.fn(),
};

const mockApi = {
    create: jest.fn(),
    createWithIdempotencyKey: jest.fn(),
    reportToDlq: jest.fn(),
    getSyncStatus: jest.fn(),
    list: jest.fn(),
    listByDrawId: jest.fn(),
    delete: jest.fn(),
};

const mockDrawRepository = {
    getBetTypes: jest.fn(),
};

jest.mock('@/shared/repositories/draw', () => ({
    drawRepository: mockDrawRepository,
}));

const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    withTag: jest.fn().mockReturnThis(),
};

jest.mock('@/shared/utils/logger', () => ({
    logger: mockLogger,
}));

import { syncPendingFlow } from '@/shared/repositories/bet/flows/sync-bets.flow';

describe('syncBetsFlow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('syncPendingFlow', () => {
        it('debe retornar { success: 1, failed: 0 } cuando una apuesta se sincroniza exitosamente', async () => {
            mockStorage.getPending.mockResolvedValue([
                { externalId: 'bet-1', drawId: '100', amount: 50, ownerStructure: '1' }
            ]);
            mockApi.createWithIdempotencyKey.mockResolvedValue([{ id: 'backend-1' }]);
            mockDrawRepository.getBetTypes.mockResolvedValue({ isOk: () => true, value: [] });
            mockStorage.updateStatus.mockResolvedValue(undefined);

            const result = await syncPendingFlow(mockStorage as any, mockApi as any);

            expect(result).toEqual({ success: 1, failed: 0 });
            expect(mockStorage.updateStatus).toHaveBeenCalledWith(
                'bet-1',
                'synced',
                expect.any(Object)
            );
        });

        it('debe retornar { success: 0, failed: 1 } cuando una apuesta falla con error 404', async () => {
            mockStorage.getPending.mockResolvedValue([
                { externalId: 'bet-2', drawId: '999', amount: 50, ownerStructure: '1' }
            ]);
            mockApi.createWithIdempotencyKey.mockRejectedValue({
                status: 404,
                message: 'Draw with id 999 not found'
            });
            mockStorage.updateStatus.mockResolvedValue(undefined);

            const result = await syncPendingFlow(mockStorage as any, mockApi as any);

            expect(result).toEqual({ success: 0, failed: 1 });
            expect(mockStorage.updateStatus).toHaveBeenCalledWith(
                'bet-2',
                'blocked',
                expect.objectContaining({
                    syncContext: expect.objectContaining({
                        errorType: 'FATAL',
                        lastError: expect.stringContaining('Draw with id 999 not found')
                    })
                })
            );
        });

        it('debe retornar { success: 0, failed: 1 } cuando una apuesta falla con error 400 (betType invalido)', async () => {
            mockStorage.getPending.mockResolvedValue([
                { externalId: 'bet-3', drawId: '395', amount: 50, ownerStructure: '1' }
            ]);
            mockApi.createWithIdempotencyKey.mockRejectedValue({
                status: 400,
                message: 'Bet type 1 is not valid for draw 395'
            });
            mockStorage.updateStatus.mockResolvedValue(undefined);

            const result = await syncPendingFlow(mockStorage as any, mockApi as any);

            expect(result).toEqual({ success: 0, failed: 1 });
            expect(mockStorage.updateStatus).toHaveBeenCalledWith(
                'bet-3',
                'blocked',
                expect.objectContaining({
                    syncContext: expect.objectContaining({
                        errorType: 'FATAL'
                    })
                })
            );
        });

        it('debe asignar estado "pending" y no "blocked" para errores 500 (no fatal)', async () => {
            mockStorage.getPending.mockResolvedValue([
                { externalId: 'bet-4', drawId: '100', amount: 50, ownerStructure: '1' }
            ]);
            mockApi.createWithIdempotencyKey.mockRejectedValue({
                status: 500,
                message: 'Internal server error'
            });
            mockStorage.updateStatus.mockResolvedValue(undefined);

            const result = await syncPendingFlow(mockStorage as any, mockApi as any);

            expect(result).toEqual({ success: 0, failed: 1 });
            expect(mockStorage.updateStatus).toHaveBeenCalledWith(
                'bet-4',
                'pending',
                expect.objectContaining({
                    syncContext: expect.objectContaining({
                        errorType: 'RETRYABLE'
                    })
                })
            );
        });

        it('debe NO llamar a reportToDlq para errores 500 (no fatal)', async () => {
            mockStorage.getPending.mockResolvedValue([
                { externalId: 'bet-5', drawId: '100', amount: 50, ownerStructure: '1' }
            ]);
            mockApi.createWithIdempotencyKey.mockRejectedValue({
                status: 500,
                message: 'Internal server error'
            });
            mockStorage.updateStatus.mockResolvedValue(undefined);

            await syncPendingFlow(mockStorage as any, mockApi as any);

            expect(mockApi.reportToDlq).not.toHaveBeenCalled();
        });

        it('debe llamar a reportToDlq para errores fatales (404)', async () => {
            mockStorage.getPending.mockResolvedValue([
                { externalId: 'bet-6', drawId: '999', amount: 50, ownerStructure: '1' }
            ]);
            mockApi.createWithIdempotencyKey.mockRejectedValue({
                status: 404,
                message: 'Draw not found'
            });
            mockStorage.updateStatus.mockResolvedValue(undefined);
            mockApi.reportToDlq.mockResolvedValue({ status: 'reported' });

            await syncPendingFlow(mockStorage as any, mockApi as any);

            expect(mockApi.reportToDlq).toHaveBeenCalledWith(
                expect.objectContaining({ externalId: 'bet-6' }),
                expect.stringContaining('Draw not found')
            );
        });

        it('debe manejar errores 401 y 403 como no fatales (retryable)', async () => {
            mockStorage.getPending.mockResolvedValue([
                { externalId: 'bet-auth-1', drawId: '100', amount: 50, ownerStructure: '1' }
            ]);
            mockApi.createWithIdempotencyKey.mockRejectedValue({
                status: 401,
                message: 'Unauthorized'
            });
            mockStorage.updateStatus.mockResolvedValue(undefined);

            const result = await syncPendingFlow(mockStorage as any, mockApi as any);

            expect(result).toEqual({ success: 0, failed: 1 });
            expect(mockStorage.updateStatus).toHaveBeenCalledWith(
                'bet-auth-1',
                'pending',
                expect.objectContaining({
                    syncContext: expect.objectContaining({
                        errorType: 'RETRYABLE'
                    })
                })
            );
        });

        it('debe procesar multiples apuestas y contar exitosos y fallidos', async () => {
            mockStorage.getPending.mockResolvedValue([
                { externalId: 'bet-a', drawId: '100', amount: 50, ownerStructure: '1' },
                { externalId: 'bet-b', drawId: '999', amount: 50, ownerStructure: '1' },
                { externalId: 'bet-c', drawId: '200', amount: 50, ownerStructure: '1' },
            ]);
            mockApi.createWithIdempotencyKey
                .mockResolvedValueOnce([{ id: 'backend-a' }])
                .mockRejectedValueOnce({ status: 404, message: 'Draw not found' })
                .mockRejectedValueOnce({ status: 500, message: 'Server error' });
            mockDrawRepository.getBetTypes.mockResolvedValue({ isOk: () => true, value: [] });
            mockStorage.updateStatus.mockResolvedValue(undefined);

            const result = await syncPendingFlow(mockStorage as any, mockApi as any);

            expect(result).toEqual({ success: 1, failed: 2 });
        });

        it('debe rechazar apuestas con amount <= 0', async () => {
            mockStorage.getPending.mockResolvedValue([
                { externalId: 'bet-invalid', drawId: '100', amount: 0, ownerStructure: '1' }
            ]);

            const result = await syncPendingFlow(mockStorage as any, mockApi as any);

            expect(result).toEqual({ success: 0, failed: 1 });
        });

        it('debe rechazar apuestas sin ownerStructure', async () => {
            mockStorage.getPending.mockResolvedValue([
                { externalId: 'bet-no-owner', drawId: '100', amount: 50, ownerStructure: '' }
            ]);

            const result = await syncPendingFlow(mockStorage as any, mockApi as any);

            expect(result).toEqual({ success: 0, failed: 1 });
        });
    });
});