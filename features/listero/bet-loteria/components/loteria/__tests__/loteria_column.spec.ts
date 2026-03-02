import { groupBetsByReceipt } from '../loteria_column.impl';
import { LoteriaBet } from '@/types';

describe('LoteriaColumn Implementation Logic', () => {
    const mockBets: LoteriaBet[] = [
        { id: '1', bet: '12-34-56', amount: 10, receiptCode: 'R1' },
        { id: '2', bet: '22-33-44', amount: 20, receiptCode: 'R1' },
        { id: '3', bet: '55-66-77', amount: 30, receiptCode: 'R2' },
        { id: '4', bet: '88-99-00', amount: 40, receiptCode: undefined },
    ];

    it('should group all bets under "local" when isEditing is true', () => {
        const result = groupBetsByReceipt(mockBets, true);
        expect(result).toHaveLength(1);
        expect(result[0].receiptCode).toBe('local');
        expect(result[0].items).toEqual(mockBets);
    });

    it('should group bets by receiptCode when isEditing is false', () => {
        const result = groupBetsByReceipt(mockBets, false);
        expect(result).toHaveLength(3); // R1, R2, and '-----' for undefined
        
        const r1Group = result.find(g => g.receiptCode === 'R1');
        expect(r1Group?.items).toHaveLength(2);
        
        const r2Group = result.find(g => g.receiptCode === 'R2');
        expect(r2Group?.items).toHaveLength(1);
        
        const defaultGroup = result.find(g => g.receiptCode === '-----');
        expect(defaultGroup?.items).toHaveLength(1);
    });

    it('should handle empty bets list', () => {
        const result = groupBetsByReceipt([], false);
        expect(result).toEqual([]);
    });
});
