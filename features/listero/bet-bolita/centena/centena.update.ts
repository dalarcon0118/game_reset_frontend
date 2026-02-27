import { match } from 'ts-pattern';
import { BolitaModel as Model, BolitaListData } from '../core/model';
import {
    CentenaMsg,
    PRESS_ADD_CENTENA,
    CONFIRM_CENTENA_BET,
    CANCEL_CENTENA_BET,
    EDIT_CENTENA_BET,
    DELETE_CENTENA_BET,
    UPDATE_CENTENA_BET,
    OPEN_CENTENA_AMOUNT_KEYBOARD,
    SHOW_CENTENA_DRAWER,
    SHOW_CENTENA_MODAL,
    PROCESS_BET_INPUT,
    SUBMIT_AMOUNT_INPUT,
    KEY_PRESSED,
    CONFIRM_INPUT
} from './centena.types';
import { Cmd } from '@/shared/core/cmd';
import { Return, singleton } from '@/shared/core/return';
import { generateRandomId } from '@/shared/utils/random';
import { CentenaBet } from '@/types';
import { RemoteData } from '@/shared/core/remote.data';

// Initial state for this submodule
export const initCentena = (model: Model): Return<Model, CentenaMsg> => {
    return singleton({
        ...model,
        centenaSession: {
            ...model.centenaSession,
        },
    });
};

export const updateCentena = (model: Model, msg: CentenaMsg): Return<Model, CentenaMsg> => {
    return match<CentenaMsg, Return<Model, CentenaMsg>>(msg)
        .with({ type: 'PRESS_ADD_CENTENA' }, () => {
            return Return.val(
                {
                    ...model,
                    editState: {
                        ...model.editState,
                        currentInput: '',
                        showBetKeyboard: true,
                        editingAmountType: 'centena',
                    },
                    centenaSession: {
                        ...model.centenaSession,
                        activeCentenaBetId: null, // null indicates we are creating a new one
                        isCentenaDrawerVisible: true,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: 'CONFIRM_CENTENA_BET' }, ({ betNumber }) => {
            if (!model.centenaSession.activeCentenaBetId) {
                return singleton(model);
            }

            if (model.isEditing) {
                const updatedEntrySession = {
                    ...model.entrySession,
                    centenas: model.entrySession.centenas.map((centena: CentenaBet) =>
                        centena.id === model.centenaSession.activeCentenaBetId
                            ? { ...centena, bet: betNumber, amount: 0 }
                            : centena
                    ),
                };

                return Return.val(
                    {
                        ...model,
                        entrySession: updatedEntrySession,
                        editState: {
                            ...model.editState,
                            editingAmountType: 'centena',
                            currentInput: '',
                        },
                        centenaSession: {
                            ...model.centenaSession,
                            isCentenaDrawerVisible: false,
                            isAmountDrawerVisible: true,
                        },
                    },
                    Cmd.none
                );
            } else {
                const nextRemoteData = RemoteData.map((data: BolitaListData) => ({
                    ...data,
                    centenas: data.centenas.map((centena: CentenaBet) =>
                        centena.id === model.centenaSession.activeCentenaBetId
                            ? { ...centena, bet: betNumber, amount: 0 }
                            : centena
                    ),
                }), model.listState.remoteData);

                return Return.val(
                    {
                        ...model,
                        listState: {
                            ...model.listState,
                            remoteData: nextRemoteData,
                        },
                        editState: {
                            ...model.editState,
                            editingAmountType: 'centena',
                            currentInput: '',
                        },
                        centenaSession: {
                            ...model.centenaSession,
                            isCentenaDrawerVisible: false,
                            isAmountDrawerVisible: true,
                        },
                    },
                    Cmd.none
                );
            }
        })
        .with({ type: 'CANCEL_CENTENA_BET' }, () => {
            if (model.isEditing) {
                const updatedEntrySession = {
                    ...model.entrySession,
                    centenas: model.entrySession.centenas.filter((centena: CentenaBet) =>
                        centena.id !== model.centenaSession.activeCentenaBetId
                    ),
                };

                return Return.val(
                    {
                        ...model,
                        entrySession: updatedEntrySession,
                        centenaSession: {
                            ...model.centenaSession,
                            activeCentenaBetId: null,
                            isCentenaDrawerVisible: false,
                        },
                    },
                    Cmd.none
                );
            } else {
                const nextRemoteData = RemoteData.map((data: BolitaListData) => ({
                    ...data,
                    centenas: data.centenas.filter((centena: CentenaBet) =>
                        centena.id !== model.centenaSession.activeCentenaBetId
                    ),
                }), model.listState.remoteData);

                return Return.val(
                    {
                        ...model,
                        listState: {
                            ...model.listState,
                            remoteData: nextRemoteData,
                        },
                        centenaSession: {
                            ...model.centenaSession,
                            activeCentenaBetId: null,
                            isCentenaDrawerVisible: false,
                        },
                    },
                    Cmd.none
                );
            }
        })
        .with({ type: 'EDIT_CENTENA_BET' }, ({ betId }) => {
            return Return.val(
                {
                    ...model,
                    editState: {
                        ...model.editState,
                        currentInput: '',
                        showBetKeyboard: true,
                        editingAmountType: 'centena',
                    },
                    centenaSession: {
                        ...model.centenaSession,
                        activeCentenaBetId: betId,
                        isCentenaDrawerVisible: true,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: 'DELETE_CENTENA_BET' }, ({ betId }) => {
            if (model.isEditing) {
                const updatedEntrySession = {
                    ...model.entrySession,
                    centenas: model.entrySession.centenas.filter((centena: CentenaBet) => centena.id !== betId),
                };

                return Return.val(
                    {
                        ...model,
                        entrySession: updatedEntrySession,
                        centenaSession: {
                            ...model.centenaSession,
                            activeCentenaBetId: model.centenaSession.activeCentenaBetId === betId ? null : model.centenaSession.activeCentenaBetId,
                        },
                    },
                    Cmd.none
                );
            } else {
                const nextRemoteData = RemoteData.map((data: BolitaListData) => ({
                    ...data,
                    centenas: data.centenas.filter((centena: CentenaBet) => centena.id !== betId),
                }), model.listState.remoteData);

                return Return.val(
                    {
                        ...model,
                        listState: {
                            ...model.listState,
                            remoteData: nextRemoteData,
                        },
                        centenaSession: {
                            ...model.centenaSession,
                            activeCentenaBetId: model.centenaSession.activeCentenaBetId === betId ? null : model.centenaSession.activeCentenaBetId,
                        },
                    },
                    Cmd.none
                );
            }
        })
        .with({ type: 'UPDATE_CENTENA_BET' }, ({ betId, changes }) => {
            if (model.isEditing) {
                const updatedEntrySession = {
                    ...model.entrySession,
                    centenas: model.entrySession.centenas.map((centena: CentenaBet) =>
                        centena.id === betId ? { ...centena, ...changes } : centena
                    ),
                };

                return Return.val(
                    {
                        ...model,
                        entrySession: updatedEntrySession,
                    },
                    Cmd.none
                );
            } else {
                const nextRemoteData = RemoteData.map((data: BolitaListData) => ({
                    ...data,
                    centenas: data.centenas.map((centena: CentenaBet) =>
                        centena.id === betId ? { ...centena, ...changes } : centena
                    ),
                }), model.listState.remoteData);

                return Return.val(
                    {
                        ...model,
                        listState: {
                            ...model.listState,
                            remoteData: nextRemoteData,
                        },
                    },
                    Cmd.none
                );
            }
        })
        .with({ type: 'OPEN_CENTENA_AMOUNT_KEYBOARD' }, ({ betId }) => {
            return Return.val(
                {
                    ...model,
                    editState: {
                        ...model.editState,
                        editingAmountType: 'centena',
                        editingBetId: betId,
                        showAmountKeyboard: true,
                        showBetKeyboard: false,
                        currentInput: '',
                    },
                    centenaSession: {
                        ...model.centenaSession,
                        activeCentenaBetId: betId,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: 'SHOW_CENTENA_DRAWER' }, ({ visible }) => {
            return Return.val(
                {
                    ...model,
                    editState: {
                        ...model.editState,
                        showBetKeyboard: visible,
                        currentInput: visible ? model.editState.currentInput : '',
                    },
                    centenaSession: {
                        ...model.centenaSession,
                        isCentenaDrawerVisible: visible,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: 'SHOW_CENTENA_MODAL' }, ({ visible }) => {
            return Return.val(
                {
                    ...model,
                    editState: {
                        ...model.editState,
                        showAmountKeyboard: visible,
                        editingAmountType: visible ? 'centena' : null,
                        currentInput: visible ? model.editState.currentInput : '',
                    },
                    centenaSession: {
                        ...model.centenaSession,
                        isAmountDrawerVisible: visible,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: 'KEY_PRESSED' }, ({ key }) => {
            let newInput = model.editState.currentInput;
            if (key === 'backspace') {
                newInput = newInput.slice(0, -1);
            } else {
                newInput += key;
            }

            return singleton({
                ...model,
                editState: {
                    ...model.editState,
                    currentInput: newInput,
                }
            });
        })
        .with({ type: 'CONFIRM_INPUT' }, () => {
            const { currentInput, showBetKeyboard, showAmountKeyboard, editingAmountType } = model.editState;

            if (showBetKeyboard) {
                return updateCentena(model, PROCESS_BET_INPUT({ inputString: currentInput }));
            }

            if (showAmountKeyboard && editingAmountType === 'centena') {
                return updateCentena(model, SUBMIT_AMOUNT_INPUT({ amountString: currentInput }));
            }

            return singleton(model);
        })
        .with({ type: 'PROCESS_BET_INPUT' }, ({ inputString }) => {
            const { activeCentenaBetId } = model.centenaSession;

            const betNumber = parseInt(inputString, 10);
            if (isNaN(betNumber) || betNumber < 0 || betNumber > 999) {
                // If invalid input, just close the drawer
                return Return.val(
                    {
                        ...model,
                        editState: {
                            ...model.editState,
                            currentInput: '',
                            showBetKeyboard: false,
                        },
                        centenaSession: {
                            ...model.centenaSession,
                            isCentenaDrawerVisible: false,
                            activeCentenaBetId: null,
                        }
                    },
                    Cmd.none
                );
            }

            // If activeCentenaBetId is null, create a new bet
            if (!activeCentenaBetId) {
                const newCentena: CentenaBet = {
                    id: generateRandomId(),
                    bet: betNumber,
                    amount: 0,
                };

                if (model.isEditing) {
                    const updatedEntrySession = {
                        ...model.entrySession,
                        centenas: [...model.entrySession.centenas, newCentena],
                    };

                    return Return.val(
                        {
                            ...model,
                            entrySession: updatedEntrySession,
                            editState: {
                                ...model.editState,
                                currentInput: '',
                                showBetKeyboard: false,
                                showAmountKeyboard: true,
                                editingAmountType: 'centena',
                                editingBetId: newCentena.id,
                            },
                            centenaSession: {
                                ...model.centenaSession,
                                isCentenaDrawerVisible: false,
                                activeCentenaBetId: newCentena.id,
                            }
                        },
                        Cmd.none
                    );
                } else {
                    const nextRemoteData = RemoteData.map((data: BolitaListData) => ({
                        ...data,
                        centenas: [...data.centenas, newCentena],
                    }), model.listState.remoteData);

                    return Return.val(
                        {
                            ...model,
                            listState: {
                                ...model.listState,
                                remoteData: nextRemoteData,
                            },
                            editState: {
                                ...model.editState,
                                currentInput: '',
                                showBetKeyboard: false,
                                showAmountKeyboard: true,
                                editingAmountType: 'centena',
                                editingBetId: newCentena.id,
                            },
                            centenaSession: {
                                ...model.centenaSession,
                                isCentenaDrawerVisible: false,
                                activeCentenaBetId: newCentena.id,
                            }
                        },
                        Cmd.none
                    );
                }
            }

            // Otherwise update existing bet (just the number)
            if (model.isEditing) {
                const updatedEntrySession = {
                    ...model.entrySession,
                    centenas: model.entrySession.centenas.map((c: CentenaBet) =>
                        c.id === activeCentenaBetId ? { ...c, bet: betNumber } : c
                    ),
                };

                return Return.val(
                    {
                        ...model,
                        entrySession: updatedEntrySession,
                        editState: {
                            ...model.editState,
                            currentInput: '',
                            showBetKeyboard: false,
                        },
                        centenaSession: {
                            ...model.centenaSession,
                            isCentenaDrawerVisible: false,
                        }
                    },
                    Cmd.none
                );
            } else {
                const nextRemoteData = RemoteData.map((data: BolitaListData) => ({
                    ...data,
                    centenas: data.centenas.map((c: CentenaBet) =>
                        c.id === activeCentenaBetId ? { ...c, bet: betNumber } : c
                    ),
                }), model.listState.remoteData);

                return Return.val(
                    {
                        ...model,
                        listState: {
                            ...model.listState,
                            remoteData: nextRemoteData,
                        },
                        editState: {
                            ...model.editState,
                            currentInput: '',
                            showBetKeyboard: false,
                        },
                        centenaSession: {
                            ...model.centenaSession,
                            isCentenaDrawerVisible: false,
                        }
                    },
                    Cmd.none
                );
            }
        })
        .with({ type: 'SUBMIT_AMOUNT_INPUT' }, ({ amountString }) => {
            const { activeCentenaBetId } = model.centenaSession;
            const betIdToUpdate = activeCentenaBetId || model.editState.editingBetId;

            if (!betIdToUpdate) return singleton(model);

            const amount = parseInt(amountString, 10);
            if (isNaN(amount)) return singleton(model);

            if (model.isEditing) {
                const updatedEntrySession = {
                    ...model.entrySession,
                    centenas: model.entrySession.centenas.map((c: CentenaBet) =>
                        c.id === betIdToUpdate ? { ...c, amount } : c
                    ),
                };

                return Return.val(
                    {
                        ...model,
                        entrySession: updatedEntrySession,
                        editState: {
                            ...model.editState,
                            currentInput: '',
                            showAmountKeyboard: false,
                            editingAmountType: null,
                            editingBetId: null,
                        },
                        centenaSession: {
                            ...model.centenaSession,
                            isAmountDrawerVisible: false,
                            activeCentenaBetId: null,
                        }
                    },
                    Cmd.none
                );
            } else {
                const nextRemoteData = RemoteData.map((data: BolitaListData) => ({
                    ...data,
                    centenas: data.centenas.map((c: CentenaBet) =>
                        c.id === betIdToUpdate ? { ...c, amount } : c
                    ),
                }), model.listState.remoteData);

                return Return.val(
                    {
                        ...model,
                        listState: {
                            ...model.listState,
                            remoteData: nextRemoteData,
                        },
                        editState: {
                            ...model.editState,
                            currentInput: '',
                            showAmountKeyboard: false,
                            editingAmountType: null,
                            editingBetId: null,
                        },
                        centenaSession: {
                            ...model.centenaSession,
                            isAmountDrawerVisible: false,
                            activeCentenaBetId: null,
                        }
                    },
                    Cmd.none
                );
            }
        })
        .exhaustive();
};
