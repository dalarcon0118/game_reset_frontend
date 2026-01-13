// UI State types - keyboard, drawer, modal states for bet editing
import { GameType } from '@/types';

export interface UiState {
    error: string | null;
}

export enum UiMsgType {
    SET_ACTIVE_ANNOTATION_TYPE = 'SET_ACTIVE_ANNOTATION_TYPE',
    SET_ACTIVE_GAME_TYPE = 'SET_ACTIVE_GAME_TYPE',
    CLEAR_ERROR = 'CLEAR_ERROR',
    CLOSE_ALL_DRAWERS = 'CLOSE_ALL_DRAWERS',
}

export type UiMsg =
    | { type: UiMsgType.SET_ACTIVE_ANNOTATION_TYPE; annotationType: string | null }
    | { type: UiMsgType.SET_ACTIVE_GAME_TYPE; gameType: GameType | null }
    | { type: UiMsgType.CLEAR_ERROR }
    | { type: UiMsgType.CLOSE_ALL_DRAWERS };

export type UiFeatMsg = { type: 'UI'; payload: UiMsg };
