export interface LoteriaColumnActions {
    onEditBet: (betId: string, field: string, value: any) => void;
    onOpenAmountKeyboard: (betId: string) => void;
    onOpenBetKeyboard: () => void;
    onViewReceipt: (receiptCode: string) => void;
    onKeyPress: (key: string) => void;
    onConfirmInput: () => void;
    onCloseBetKeyboard: () => void;
    onCloseAmountKeyboard: () => void;
}
