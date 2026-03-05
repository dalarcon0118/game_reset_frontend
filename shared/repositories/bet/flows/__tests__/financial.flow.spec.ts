import { IBetStorage } from '../../bet.ports';
import { BetDomainModel } from '../../bet.types';
import { getTotalsByDrawIdFlow } from '../financial.flow';

const createBet = (partial: Partial<BetDomainModel>): BetDomainModel => ({
  externalId: partial.externalId || 'ext-1',
  status: partial.status || 'pending',
  timestamp: partial.timestamp || Date.now(),
  drawId: partial.drawId ?? '1',
  betTypeId: partial.betTypeId || 'type-1',
  amount: partial.amount ?? 0,
  numbers: partial.numbers ?? '12',
  ownerStructure: partial.ownerStructure ?? '10',
  receiptCode: partial.receiptCode,
  backendId: partial.backendId,
  backendBets: partial.backendBets,
  commissionRate: partial.commissionRate,
  lastError: partial.lastError,
  retryCount: partial.retryCount,
});

const createStorage = (bets: BetDomainModel[]): IBetStorage => ({
  save: async () => {},
  getAll: async () => bets,
  getPending: async () => bets.filter((bet) => bet.status === 'pending' || bet.status === 'error'),
  getByStatus: async (status) => bets.filter((bet) => bet.status === status),
  updateStatus: async () => {},
  delete: async () => {},
});

describe('financial.flow', () => {
  it('calcula betCount y monto por sorteo para apuestas de hoy', async () => {
    const dayStart = new Date(2026, 2, 5, 0, 0, 0, 0).getTime();
    const twoHoursAfter = dayStart + 2 * 60 * 60 * 1000;
    const storage = createStorage([
      createBet({ externalId: 'a', drawId: '100', amount: 10, timestamp: twoHoursAfter, ownerStructure: '1' }),
      createBet({ externalId: 'b', drawId: '100', amount: 20, timestamp: twoHoursAfter + 1000, ownerStructure: '1' }),
      createBet({ externalId: 'c', drawId: '200', amount: 5, timestamp: twoHoursAfter + 2000, ownerStructure: '1' }),
      createBet({ externalId: 'd', drawId: '100', amount: 99, timestamp: dayStart - 1000, ownerStructure: '1' }),
    ]);

    const result = await getTotalsByDrawIdFlow(storage, dayStart, '1');

    expect(result['100']).toBeDefined();
    expect(result['100'].totalCollected).toBe(30);
    expect(result['100'].betCount).toBe(2);
    expect(result['200'].totalCollected).toBe(5);
    expect(result['200'].betCount).toBe(1);
    expect(result['100'].netResult).toBe(30);
  });

  it('ignora apuestas sin drawId válido usando fallback legacy', async () => {
    const dayStart = new Date(2026, 2, 5, 0, 0, 0, 0).getTime();
    const now = dayStart + 1000;
    const storage = createStorage([
      createBet({ externalId: 'x', drawId: '' as any, amount: 10, timestamp: now, ownerStructure: '1' }),
      createBet({ externalId: 'y', drawId: '' as any, amount: 15, timestamp: now, ownerStructure: '1', numbers: { any: true } }),
      {
        ...createBet({ externalId: 'z', drawId: '' as any, amount: 12, timestamp: now, ownerStructure: '1' }),
        data: { draw: '300', amount: 12, timestamp: now }
      } as any
    ]);

    const result = await getTotalsByDrawIdFlow(storage, dayStart, '1');

    expect(result['300']).toBeDefined();
    expect(result['300'].totalCollected).toBe(12);
    expect(result['300'].betCount).toBe(1);
    expect(result['']).toBeUndefined();
  });
});
