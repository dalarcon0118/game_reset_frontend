import { WinningBet } from '@/shared/repositories/bet/winnings.types';

export interface GroupedReceipt {
  receiptCode: string;
  timestamp: string;
  totalPayout: number;
  totalBetAmount: number;
  bets: WinningBet[];
}

/**
 * 🧪 SELECTOR: Agrupar Premios por Recibo
 * Transforma un array plano de apuestas ganadoras en una estructura
 * agrupada por ticket (receiptCode) para mejorar la UX.
 */
export const selectGroupedWinnings = (winningBets: WinningBet[]): GroupedReceipt[] => {
  const groups: Record<string, GroupedReceipt> = {};

  winningBets.forEach((bet) => {
    // Usamos el receipt_code como clave de agrupación. 
    // Si no existe, usamos un fallback para evitar errores.
    const key = bet.receipt_code || 'unknown-ticket';

    if (!groups[key]) {
      groups[key] = {
        receiptCode: key,
        timestamp: bet.created_at || '',
        totalPayout: 0,
        totalBetAmount: 0,
        bets: [],
      };
    }

    groups[key].totalPayout += Number(bet.payout_amount || 0);
    groups[key].totalBetAmount += Number(bet.amount || 0);
    groups[key].bets.push(bet);
  });

  // Retornamos como array ordenado por fecha (más reciente primero)
  return Object.values(groups).sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};
