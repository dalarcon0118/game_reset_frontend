import { ExtendedDrawType } from '@/shared/services/draw/types';

export interface WinningState {
  status: 'NotAsked' | 'Loading' | 'Success' | 'Failure';
  draws: ExtendedDrawType[];
  error: string | null;
}

export interface WinnerDraw extends ExtendedDrawType {}
