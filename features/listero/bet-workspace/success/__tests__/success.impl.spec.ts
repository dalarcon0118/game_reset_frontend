import { SuccessImpl } from '../core/domain/success.impl';
import { VoucherSourceData } from '../core/domain/success.ports';

describe('SuccessImpl', () => {
    const mockSource: VoucherSourceData = {
        draw: { id: '123', draw_datetime: '2026-01-01T10:00:00Z', extra_data: { jackpot_amount: '5000000' } } as any,
        bets: [
            { id: '1', type: 'fijo', numbers: '25', amount: 10, receiptCode: 'ABC-123' },
            { id: '2', type: 'corrido', numbers: '25', amount: 5, receiptCode: 'ABC-123' }
        ] as any
    };

    it('should transform source data to VoucherData correctly', () => {
        const result = SuccessImpl.toVoucherData(mockSource, 'ABC-123');

        expect(result.drawId).toBe('123');
        expect(result.receiptCode).toBe('ABC-123');
        expect(result.totalAmount).toBe(15);
        expect(result.bets).toHaveLength(1); // Grouped Fijo/Corrido
        expect(result.bets[0].type).toBe('Fijo/Corrido');
        expect(result.bets[0].amount).toBe(15);
        expect(result.isBolita).toBe(true);
    });

    it('should calculate metadata correctly', () => {
        const metadata = SuccessImpl.calculateMetadata(mockSource.draw);
        expect(metadata.awardDate).toContain('01/01/2026');
        expect(metadata.totalPrize).toContain('5,000,000.00');
    });
});
