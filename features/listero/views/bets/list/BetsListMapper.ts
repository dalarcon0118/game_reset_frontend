import { BetType } from '@/types';

export interface FijoCorridoBet {
  id: string;
  bet: number;
  fijoAmount: number | 'X';
  corridoAmount: number | 'X';
  createdAt?: string; // Added field for sorting
}

export interface ParletBet {
  id: string;
  bets: number[];
  amount: number;
  createdAt?: string; // Added field for sorting
}

export interface CentenaBet {
  id: string;
  bet: number;
  amount: number;
  createdAt?: string; // Added field for sorting
}

export interface BetsListViewModel {
  fijosCorridos: FijoCorridoBet[];
  parlets: ParletBet[];
  centenas: CentenaBet[];
}

export class BetsListMapper {
  static transform(bets: BetType[] | null): BetsListViewModel {
    if (!bets) return { fijosCorridos: [], parlets: [], centenas: [] };

    const fijosCorridosList: FijoCorridoBet[] = [];
    const parletsList: ParletBet[] = [];
    const centenasList: CentenaBet[] = [];
    const processedIds = new Set<string>();

    bets.forEach((bet: BetType) => {
      if (processedIds.has(bet.id)) return;
      processedIds.add(bet.id);

      try {
        let parsedNumbers: any;
        try {
          parsedNumbers = JSON.parse(bet.numbers);
        } catch {
          parsedNumbers = bet.numbers;
        }

        const extractSingleNumber = (val: any): number | null => {
          if (typeof val === 'number') return val;
          if (typeof val === 'string') {
            const n = parseInt(val, 10);
            return isNaN(n) ? null : n;
          }
          if (Array.isArray(val) && val.length > 0) {
            const first = val[0];
            const n = typeof first === 'number' ? first : parseInt(first, 10);
            return isNaN(n) ? null : n;
          }
          if (val && typeof val === 'object') {
            if ('number' in val) return extractSingleNumber(val.number);
            if ('bet' in val) return extractSingleNumber(val.bet);
          }
          return null;
        };

        const extractNumberArray = (val: any): number[] => {
          const toNum = (x: any) => (typeof x === 'number' ? x : parseInt(x, 10));
          if (typeof val === 'string') {
            if (val.includes('-')) {
              return val.split('-').map(s => parseInt(s, 10)).filter((n: number) => !isNaN(n));
            }
            const n = parseInt(val, 10);
            return isNaN(n) ? [] : [n];
          }
          if (Array.isArray(val)) return val.map(toNum).filter((n: number) => !isNaN(n));
          if (val && typeof val === 'object') {
            if (Array.isArray(val.numbers)) return val.numbers.map(toNum).filter((n: number) => !isNaN(n));
            if (Array.isArray(val.pair)) return val.pair.map(toNum).filter((n: number) => !isNaN(n));
          }
          return [];
        };
        
        if (bet.type === 'Fijo' || bet.type === 'Corrido') {
          const number = extractSingleNumber(parsedNumbers);
          
          if (number !== null && !isNaN(number)) {
            fijosCorridosList.push({
              id: bet.id,
              bet: number,
              fijoAmount: bet.type === 'Fijo' ? bet.amount : 'X',
              corridoAmount: bet.type === 'Corrido' ? bet.amount : 'X',
              createdAt: bet.createdAt
            });
          }
        } 
        else if (bet.type === 'Parlet') {
          const numbers = extractNumberArray(parsedNumbers);
          parletsList.push({
            id: bet.id,
            bets: numbers,
            amount: bet.amount,
            createdAt: bet.createdAt
          });
        }
        else if ((bet.type as string) === 'Centena') { 
             const number = extractSingleNumber(parsedNumbers);
             if (number !== null && !isNaN(number)) {
               centenasList.push({
                 id: bet.id,
                 bet: number,
                 amount: bet.amount,
                 createdAt: bet.createdAt
               });
             }
        }
      } catch (e) {
        console.warn('Error parsing bet numbers:', bet.numbers, e);
      }
    });

    // Helper to parse date string into timestamp
    const getTimestamp = (dateStr?: string) => {
        if (!dateStr) return 0;
        // Assuming format HH:mm or full date. 
        // If it's just time, we might need more context, but let's try basic parsing
        // If the format is strictly HH:mm (from backend mapping), we can just compare strings 
        // if they are in 24h format.
        return dateStr; 
    };

    const sortedFijosCorridos = fijosCorridosList.sort((a, b) => {
      // Sort by createdAt (descending - newest first)
      if (a.createdAt !== b.createdAt) {
          return (b.createdAt || '').localeCompare(a.createdAt || '');
      }
      return a.bet - b.bet;
    });

    // Merge Fijo and Corrido bets that share the same number and time (likely same ticket)
    const mergedFijosCorridos: FijoCorridoBet[] = [];
    if (sortedFijosCorridos.length > 0) {
      let current = sortedFijosCorridos[0];
      
      for (let i = 1; i < sortedFijosCorridos.length; i++) {
        const next = sortedFijosCorridos[i];
        
        // Normalize times for comparison (ignoring potential second differences if any)
        // Since we don't have the raw date here, we rely on the string being HH:mm or HH:mm:ss
        // If it matches exactly, great. If not, we check if they are very close? 
        // For now, let's assume strict equality is intended for "same ticket".
        // But to be safe, if the string format includes seconds, we might want to trim them?
        // Let's stick to strict equality for now as BetService is supposed to return HH:mm.
        
        const sameTime = current.createdAt === next.createdAt;
        const sameNumber = current.bet === next.bet;
        
        // Check if mergeable
        if (sameTime && sameNumber) {
           // Check for collision (prevent merging if both have values in the same slot)
           const hasFijoCollision = current.fijoAmount !== 'X' && next.fijoAmount !== 'X';
           const hasCorridoCollision = current.corridoAmount !== 'X' && next.corridoAmount !== 'X';
           
           if (!hasFijoCollision && !hasCorridoCollision) {
               // Safe to merge
               current = {
                 ...current,
                 fijoAmount: current.fijoAmount !== 'X' ? current.fijoAmount : next.fijoAmount,
                 corridoAmount: current.corridoAmount !== 'X' ? current.corridoAmount : next.corridoAmount
               };
               continue; 
           }
        }
        
        mergedFijosCorridos.push(current);
        current = next;
      }
      mergedFijosCorridos.push(current);
    }


    const sortedParlets = parletsList.sort((a, b) => {
      if (a.createdAt !== b.createdAt) {
          return (b.createdAt || '').localeCompare(a.createdAt || '');
      }
      if (a.amount === b.amount) {
        const aKey = a.bets.join('-');
        const bKey = b.bets.join('-');
        return aKey.localeCompare(bKey);
      }
      return a.amount - b.amount;
    });

    const sortedCentenas = centenasList.sort((a, b) => {
      if (a.createdAt !== b.createdAt) {
          return (b.createdAt || '').localeCompare(a.createdAt || '');
      }
      if (a.amount === b.amount) return a.bet - b.bet;
      return a.amount - b.amount;
    });

    return {
      fijosCorridos: mergedFijosCorridos,
      parlets: sortedParlets,
      centenas: sortedCentenas
    };
  }
}
