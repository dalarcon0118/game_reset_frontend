export enum SuccessMsgType {
    SHARE_VOUCHER_REQUESTED = 'SUCCESS/SHARE_VOUCHER_REQUESTED',
    SHARE_VOUCHER_SUCCESS = 'SUCCESS/SHARE_VOUCHER_SUCCESS',
    SHARE_VOUCHER_FAILED = 'SUCCESS/SHARE_VOUCHER_FAILED',
    GO_HOME_REQUESTED = 'SUCCESS/GO_HOME_REQUESTED',
}

export type SuccessMsg =
    | { type: SuccessMsgType.SHARE_VOUCHER_REQUESTED; uri: string }
    | { type: SuccessMsgType.SHARE_VOUCHER_SUCCESS }
    | { type: SuccessMsgType.SHARE_VOUCHER_FAILED; error: string }
    | { type: SuccessMsgType.GO_HOME_REQUESTED };

export interface FormattedBet {
    id: string;
    type: string;
    numbers: string[];
    amount: number;
}

export interface SuccessState {
    // Podríamos guardar aquí datos específicos si fuera necesario, 
    // pero por ahora la lógica de formateo puede ser derivada del managementSession
}
