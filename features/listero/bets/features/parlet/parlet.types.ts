import { FijosCorridosBet, ParletBet, GameType } from '@/types';

export interface Model {
    potentialParletNumbers: number[];
    fromFijosyCorridoBet: boolean;
    parletAlertVisibleState: boolean;
    activeParletBetId: string | null;
    isParletDrawerVisible: boolean;
    isParletModalVisible: boolean;
    isAmmountDrawerVisible: boolean;
    activeAnnotationType: string | null;
    activeGameType: GameType | null;
    canceledFromFijosyCorridoBet: boolean;
}

export const initialParletState: Model = {
    potentialParletNumbers: [],
    fromFijosyCorridoBet: false,
    parletAlertVisibleState: false,
    activeParletBetId: null,
    isParletDrawerVisible: false,
    isParletModalVisible: false,
    isAmmountDrawerVisible: false,
    activeAnnotationType: null,
    activeGameType: null,
    canceledFromFijosyCorridoBet: false,
};

export enum ParletMsgType {
    PRESS_ADD_PARLET = 'PRESS_ADD_PARLET',
    CONFIRM_PARLET_BET = 'CONFIRM_PARLET_BET',
    CANCEL_PARLET_BET = 'CANCEL_PARLET_BET',
    EDIT_PARLET_BET = 'EDIT_PARLET_BET',
    DELETE_PARLET_BET = 'DELETE_PARLET_BET',
    UPDATE_PARLET_BET = 'UPDATE_PARLET_BET',
    OPEN_PARLET_AMOUNT_KEYBOARD = 'OPEN_PARLET_AMOUNT_KEYBOARD',
    SHOW_PARLET_DRAWER = 'SHOW_PARLET_DRAWER',
    SHOW_PARLET_MODAL = 'SHOW_PARLET_MODAL',
    SHOW_PARLET_ALERT = 'SHOW_PARLET_ALERT',
}

export type ParletMsg =
    | { type: ParletMsgType.PRESS_ADD_PARLET; fijosCorridosList: FijosCorridosBet[] }
    | { type: ParletMsgType.CONFIRM_PARLET_BET }
    | { type: ParletMsgType.CANCEL_PARLET_BET }
    | { type: ParletMsgType.EDIT_PARLET_BET; betId: string }
    | { type: ParletMsgType.DELETE_PARLET_BET; betId: string }
    | { type: ParletMsgType.UPDATE_PARLET_BET; betId: string; changes: Partial<ParletBet> }
    | { type: ParletMsgType.OPEN_PARLET_AMOUNT_KEYBOARD; betId: string }
    | { type: ParletMsgType.SHOW_PARLET_DRAWER; visible: boolean }
    | { type: ParletMsgType.SHOW_PARLET_MODAL; visible: boolean }
    | { type: ParletMsgType.SHOW_PARLET_ALERT; visible: boolean };
