import { IWinningRepository } from './winning.ports';
import { WinningApiAdapter } from './adapters/winning.api.adapter';

export * from './winning.ports';
export * from './api/types/types';

export const winningRepository: IWinningRepository = new WinningApiAdapter();
