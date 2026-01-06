// Session State types - create and edit sessions
import { GameType } from './base.types';

export interface CreateSession {
    selectedDrawId: string | null;
    selectedGameType: GameType | null;
    numbersPlayed: string;
    amount: string;
    tempBets: {
        gameType: GameType;
        numbers: string;
        amount: number;
    }[];
}

export interface EditSession {
    selectedColumn: string | null;
    selectedCircle: number | null;
    isRangeMode: boolean;
    rangeType: 'continuous' | 'terminal' | null;
    currentNumber: string;
    currentAmount: string;
    rangeStartNumber: string;
    showRangeDialog: boolean;
}
