import { WebData } from '@/shared/core/remote.data';

export enum SuccessMsgType {
    SHARE_VOUCHER_REQUESTED = 'SUCCESS/SHARE_VOUCHER_REQUESTED',
    SHARE_VOUCHER_RESPONSE = 'SUCCESS/SHARE_VOUCHER_RESPONSE',
    GO_HOME_REQUESTED = 'SUCCESS/GO_HOME_REQUESTED',
}

export type SuccessMsg =
    | { type: SuccessMsgType.SHARE_VOUCHER_REQUESTED; uri: string }
    | { type: SuccessMsgType.SHARE_VOUCHER_RESPONSE; webData: WebData<boolean> }
    | { type: SuccessMsgType.GO_HOME_REQUESTED };

export interface FormattedBet {
    id: string;
    type: string;
    numbers: string[];
    amount: number;
}

export interface VoucherMetadata {
    issueDate: string;
    awardDate: string;
    totalPrize: string;
    disclaimer: string;
}

export interface SuccessState {
    sharingStatus: WebData<boolean>;
}
