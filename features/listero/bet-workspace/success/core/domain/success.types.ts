import { WebData, RemoteData } from '@/shared/core/tea-utils/remote.data';

/**
 * Voucher Message Types
 */
export enum VoucherMsgType {
    SHARE_REQUESTED = 'VOUCHER/SHARE_REQUESTED',
    SHARE_RESPONSE = 'VOUCHER/SHARE_RESPONSE',
    GO_HOME_REQUESTED = 'VOUCHER/GO_HOME_REQUESTED',
    LOAD_DATA_REQUESTED = 'VOUCHER/LOAD_DATA_REQUESTED',
    DATA_RECEIVED = 'VOUCHER/DATA_RECEIVED',
}

/**
 * Voucher Messages
 */
export type VoucherMsg =
    | { type: VoucherMsgType.SHARE_REQUESTED; uri: string }
    | { type: VoucherMsgType.SHARE_RESPONSE; webData: WebData<boolean> }
    | { type: VoucherMsgType.GO_HOME_REQUESTED }
    | { type: VoucherMsgType.LOAD_DATA_REQUESTED; drawId?: string; receiptCode?: string }
    | { type: VoucherMsgType.DATA_RECEIVED; data: WebData<VoucherData> };

/**
 * Voucher Local Model (Agnostic)
 */
export interface VoucherModel {
    sharingStatus: WebData<boolean>;
    voucherData: WebData<VoucherData>;
}

/**
 * Initial State
 */
export const initialVoucherModel: VoucherModel = {
    sharingStatus: RemoteData.notAsked(),
    voucherData: RemoteData.notAsked()
};

/**
 * Domain DTOs
 */
export interface FormattedBet {
    id: string;
    type: string;
    numbers: string[];
    amount: number;
    fijoAmount?: number;
    corridoAmount?: number;
    receiptCode?: string;
    betTypeId?: string | number;
}

export interface GroupedBets {
    fijosCorridos: FormattedBet[];
    parlets: FormattedBet[];
    centenas: FormattedBet[];
}

export interface VoucherData {
    drawId: string | null;
    receiptCode: string;
    bets: FormattedBet[];
    totalAmount: number;
    metadata: VoucherMetadata;
    isBolita: boolean;
    groupedBets: GroupedBets | null;
}

export interface VoucherMetadata {
    issueDate: string;
    awardDate: string;
    totalPrize: string;
    disclaimer: string;
}
