import { match } from 'ts-pattern';
import { Model as GlobalModel } from '../../core/model';
import { CentenaMsgType, CentenaMsg } from './centena.types';
import { Cmd } from '@/shared/core/cmd';
import { Return, singleton } from '@/shared/core/return';
import { generateRandomId } from '../../shared/utils/numbers';
import { CentenaBet } from '@/types';
import { RemoteData } from '@/shared/core/remote.data';
import { ListData } from '../bet-list/list.types';

// Initial state for this submodule
export const initCentena = (model: GlobalModel): Return<GlobalModel, CentenaMsg> => {
    return singleton({
        ...model,
        centenaSession: {
            ...model.centenaSession,
        },
    });
};

export const updateCentena = (model: GlobalModel, msg: CentenaMsg): Return<GlobalModel, CentenaMsg> => {
    return match<CentenaMsg, Return<GlobalModel, CentenaMsg>>(msg)
        .with({ type: CentenaMsgType.PRESS_ADD_CENTENA }, () => {
            return Return.val(
                {
                    ...model,
                    editSession: {
                        ...model.editSession,
                        currentInput: '',
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
        .with({ type: CentenaMsgType.CONFIRM_CENTENA_BET }, ({ betNumber }) => {
            if (!model.centenaSession.activeCentenaBetId) {
                return singleton(model);
            }

            const nextRemoteData = RemoteData.map((data: ListData) => ({
                ...data,
                centenas: data.centenas.map((centena: CentenaBet) =>
                    centena.id === model.centenaSession.activeCentenaBetId
                        ? { ...centena, bet: betNumber, amount: 0 }
                        : centena
                ),
            }), model.listSession.remoteData);

            return Return.val(
                {
                    ...model,
                    listSession: {
                        ...model.listSession,
                        remoteData: nextRemoteData,
                    },
                    editSession: {
                        ...model.editSession,
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
        })
        .with({ type: CentenaMsgType.CANCEL_CENTENA_BET }, () => {
            const nextRemoteData = RemoteData.map((data: ListData) => ({
                ...data,
                centenas: data.centenas.filter((centena: CentenaBet) =>
                    centena.id !== model.centenaSession.activeCentenaBetId
                ),
            }), model.listSession.remoteData);

            return Return.val(
                {
                    ...model,
                    listSession: {
                        ...model.listSession,
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
        })
        .with({ type: CentenaMsgType.EDIT_CENTENA_BET }, ({ betId }) => {
            return Return.val(
                {
                    ...model,
                    editSession: {
                        ...model.editSession,
                        currentInput: '',
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
        .with({ type: CentenaMsgType.DELETE_CENTENA_BET }, ({ betId }) => {
            const nextRemoteData = RemoteData.map((data: ListData) => ({
                ...data,
                centenas: data.centenas.filter((centena: CentenaBet) => centena.id !== betId),
            }), model.listSession.remoteData);

            return Return.val(
                {
                    ...model,
                    listSession: {
                        ...model.listSession,
                        remoteData: nextRemoteData,
                    },
                    centenaSession: {
                        ...model.centenaSession,
                        activeCentenaBetId: model.centenaSession.activeCentenaBetId === betId ? null : model.centenaSession.activeCentenaBetId,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: CentenaMsgType.UPDATE_CENTENA_BET }, ({ betId, changes }) => {
            const nextRemoteData = RemoteData.map((data: ListData) => ({
                ...data,
                centenas: data.centenas.map((centena: CentenaBet) =>
                    centena.id === betId ? { ...centena, ...changes } : centena
                ),
            }), model.listSession.remoteData);

            return Return.val(
                {
                    ...model,
                    listSession: {
                        ...model.listSession,
                        remoteData: nextRemoteData,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: CentenaMsgType.OPEN_CENTENA_AMOUNT_KEYBOARD }, ({ betId }) => {
            return Return.val(
                {
                    ...model,
                    editSession: {
                        ...model.editSession,
                        editingAmountType: 'centena',
                        showCentenaKeyboard: false,
                        currentInput: '',
                    },
                    centenaSession: {
                        ...model.centenaSession,
                        activeCentenaBetId: betId,
                        isAmountDrawerVisible: true,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: CentenaMsgType.SHOW_CENTENA_DRAWER }, ({ visible }) => {
            return Return.val(
                {
                    ...model,
                    editSession: {
                        ...model.editSession,
                        currentInput: visible ? model.editSession.currentInput : '',
                    },
                    centenaSession: {
                        ...model.centenaSession,
                        isCentenaDrawerVisible: visible,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: CentenaMsgType.SHOW_CENTENA_MODAL }, ({ visible }) => {
            return Return.val(
                {
                    ...model,
                    editSession: {
                        ...model.editSession,
                        currentInput: visible ? model.editSession.currentInput : '',
                    },
                    centenaSession: {
                        ...model.centenaSession,
                        isAmountDrawerVisible: visible,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: CentenaMsgType.KEY_PRESSED }, ({ key }) => {
            let newInput = model.editSession.currentInput;
            if (key === 'backspace') {
                newInput = newInput.slice(0, -1);
            } else {
                newInput += key;
            }

            return singleton({
                ...model,
                editSession: {
                    ...model.editSession,
                    currentInput: newInput,
                }
            });
        })
        .with({ type: CentenaMsgType.CONFIRM_INPUT }, () => {
            const { currentInput } = model.editSession;
            const { isCentenaDrawerVisible, isAmountDrawerVisible } = model.centenaSession;

            if (isCentenaDrawerVisible) {
                return updateCentena(model, { type: CentenaMsgType.PROCESS_BET_INPUT, inputString: currentInput });
            }

            if (isAmountDrawerVisible) {
                return updateCentena(model, { type: CentenaMsgType.SUBMIT_AMOUNT_INPUT, amountString: currentInput });
            }

            return singleton(model);
        })
        .with({ type: CentenaMsgType.PROCESS_BET_INPUT }, ({ inputString }) => {
            const { activeCentenaBetId } = model.centenaSession;

            const betNumber = parseInt(inputString, 10);
            if (isNaN(betNumber) || betNumber < 0 || betNumber > 999) {
                // If invalid input, just close the drawer
                return Return.val(
                    {
                        ...model,
                        editSession: {
                            ...model.editSession,
                            currentInput: '',
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

                const nextRemoteData = RemoteData.map((data: ListData) => ({
                    ...data,
                    centenas: [...data.centenas, newCentena],
                }), model.listSession.remoteData);

                return Return.val(
                    {
                        ...model,
                        listSession: {
                            ...model.listSession,
                            remoteData: nextRemoteData,
                        },
                        editSession: {
                            ...model.editSession,
                            currentInput: '',
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

            // Otherwise update existing bet
            const nextRemoteData = RemoteData.map((data: ListData) => ({
                ...data,
                centenas: data.centenas.map((c: CentenaBet) =>
                    c.id === activeCentenaBetId ? { ...c, bet: betNumber } : c
                ),
            }), model.listSession.remoteData);

            return Return.val(
                {
                    ...model,
                    listSession: {
                        ...model.listSession,
                        remoteData: nextRemoteData,
                    },
                    editSession: {
                        ...model.editSession,
                        currentInput: '',
                    },
                    centenaSession: {
                        ...model.centenaSession,
                        isCentenaDrawerVisible: false,
                    }
                },
                Cmd.none
            );
        })
        .with({ type: CentenaMsgType.SUBMIT_AMOUNT_INPUT }, ({ amountString }) => {
            const { activeCentenaBetId } = model.centenaSession;
            if (!activeCentenaBetId) return singleton(model);

            const amount = parseInt(amountString, 10);
            if (isNaN(amount)) return singleton(model);

            const nextRemoteData = RemoteData.map((data: ListData) => ({
                ...data,
                centenas: data.centenas.map((c: CentenaBet) =>
                    c.id === activeCentenaBetId ? { ...c, amount } : c
                ),
            }), model.listSession.remoteData);

            return Return.val(
                {
                    ...model,
                    listSession: {
                        ...model.listSession,
                        remoteData: nextRemoteData,
                    },
                    editSession: {
                        ...model.editSession,
                        currentInput: '',
                    },
                    centenaSession: {
                        ...model.centenaSession,
                        isAmountDrawerVisible: false,
                    }
                },
                Cmd.none
            );
        })
        .exhaustive();
};