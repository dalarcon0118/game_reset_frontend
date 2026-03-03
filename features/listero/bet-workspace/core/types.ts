import { ParletBet, CentenaBet, LoteriaBet } from '@/types';

export interface ListData {
    fijosCorridos: any[]; // Placeholder for now, should be specific if possible
    parlets: ParletBet[];
    centenas: CentenaBet[];
    loteria: LoteriaBet[];
}

export interface BetSummary {
    loteriaTotal: number;
    parletsTotal: number;
    centenasTotal: number;
    grandTotal: number;
    hasBets: boolean;
    isSaving: boolean;
    count: number;
}
