import { updateFijos, updateParlet, updateCentena } from '../sub_updates';
import { initialBolitaModel } from '../../domain/models/bolita.initial';
import { BolitaModel } from '../../domain/models/bolita.types';
import { FijosCorridosBet } from '@/types';

describe('Bolita Sub-Updates Confirmation Logic', () => {
    describe('FIJOS_CONFIRM_INPUT', () => {
        it('should add new fijos bets and set isEditing to true', () => {
            const model: BolitaModel = {
                ...initialBolitaModel,
                isEditing: false,
                editState: {
                    ...initialBolitaModel.editState,
                    showBetKeyboard: true,
                    currentInput: '1234'
                }
            };

            const [newModel] = updateFijos(model, { type: 'FIJOS_CONFIRM_INPUT', payload: undefined });
            const updatedModel = newModel as BolitaModel;

            expect(updatedModel.isEditing).toBe(true);
            expect(updatedModel.entrySession.fijosCorridos).toHaveLength(2);
            expect(updatedModel.entrySession.fijosCorridos[0].bet).toBe(12);
            expect(updatedModel.entrySession.fijosCorridos[1].bet).toBe(34);
            expect(updatedModel.editState.showBetKeyboard).toBe(false);
            expect(updatedModel.editState.currentInput).toBe('');
        });

        it('should trigger amount confirmation details and not clear editing state for fijos/corridos', () => {
            const existingBet: FijosCorridosBet = { id: 'bet-1', bet: 12, fijoAmount: 0, corridoAmount: 0 };
            const model: BolitaModel = {
                ...initialBolitaModel,
                isEditing: false,
                entrySession: {
                    ...initialBolitaModel.entrySession,
                    fijosCorridos: [existingBet]
                },
                editState: {
                    ...initialBolitaModel.editState,
                    showAmountKeyboard: true,
                    editingBetId: 'bet-1',
                    editingAmountType: 'fijo',
                    currentInput: '50'
                }
            };

            const [newModel] = updateFijos(model, { type: 'FIJOS_CONFIRM_INPUT', payload: undefined });
            const updatedModel = newModel as BolitaModel;

            expect(updatedModel.isEditing).toBe(true);
            expect(updatedModel.editState.amountConfirmationDetails).not.toBeNull();
            expect(updatedModel.editState.amountConfirmationDetails?.amountValue).toBe(50);
            expect(updatedModel.editState.amountConfirmationDetails?.intendedAmountType).toBe('fijo');
            expect(updatedModel.editState.amountConfirmationDetails?.intendedBetId).toBe('bet-1');
            expect(updatedModel.editState.showAmountKeyboard).toBe(false);
            // El ID de apuesta y el tipo deben mantenerse para el diálogo
            expect(updatedModel.editState.editingBetId).toBe('bet-1');
            expect(updatedModel.editState.editingAmountType).toBe('fijo');
        });

        it('should apply amount to single bet when CONFIRM_APPLY_AMOUNT_SINGLE is called', () => {
            const existingBet: FijosCorridosBet = { id: 'bet-1', bet: 12, fijoAmount: 0, corridoAmount: 0 };
            const model: BolitaModel = {
                ...initialBolitaModel,
                entrySession: {
                    ...initialBolitaModel.entrySession,
                    fijosCorridos: [existingBet]
                },
                editState: {
                    ...initialBolitaModel.editState,
                    amountConfirmationDetails: {
                        amountValue: 75,
                        intendedAmountType: 'fijo',
                        intendedBetId: 'bet-1'
                    }
                }
            };

            const [newModel] = updateFijos(model, { type: 'CONFIRM_APPLY_AMOUNT_SINGLE', payload: undefined });
            const updatedModel = newModel as BolitaModel;

            expect(updatedModel.entrySession.fijosCorridos[0].fijoAmount).toBe(75);
            expect(updatedModel.editState.amountConfirmationDetails).toBeNull();
        });

        it('should apply amount to all bets when CONFIRM_APPLY_AMOUNT_ALL is called', () => {
            const bets: FijosCorridosBet[] = [
                { id: 'bet-1', bet: 12, fijoAmount: 0, corridoAmount: 0 },
                { id: 'bet-2', bet: 34, fijoAmount: 0, corridoAmount: 0 }
            ];
            const model: BolitaModel = {
                ...initialBolitaModel,
                entrySession: {
                    ...initialBolitaModel.entrySession,
                    fijosCorridos: bets
                },
                editState: {
                    ...initialBolitaModel.editState,
                    amountConfirmationDetails: {
                        amountValue: 100,
                        intendedAmountType: 'corrido',
                        intendedBetId: 'bet-1'
                    }
                }
            };

            const [newModel] = updateFijos(model, { type: 'CONFIRM_APPLY_AMOUNT_ALL', payload: undefined });
            const updatedModel = newModel as BolitaModel;

            expect(updatedModel.entrySession.fijosCorridos[0].corridoAmount).toBe(100);
            expect(updatedModel.entrySession.fijosCorridos[1].corridoAmount).toBe(100);
            expect(updatedModel.editState.amountConfirmationDetails).toBeNull();
        });

        it('should handle invalid input gracefully and return model with hidden keyboard', () => {
            const model: BolitaModel = {
                ...initialBolitaModel,
                editState: {
                    ...initialBolitaModel.editState,
                    showBetKeyboard: true,
                    currentInput: 'invalid'
                }
            };

            const [newModel] = updateFijos(model, { type: 'FIJOS_CONFIRM_INPUT', payload: undefined });
            const updatedModel = newModel as BolitaModel;

            expect(updatedModel.editState.showBetKeyboard).toBe(false);
            expect(updatedModel.editState.currentInput).toBe('');
        });
    });

    describe('CRUD Operations isEditing flag', () => {
        it('ADD_FIJOS_BET should set isEditing to true', () => {
            const [newModel] = updateFijos(initialBolitaModel, {
                type: 'ADD_FIJOS_BET',
                payload: { fijosBet: { number: 12, fijoAmount: 10, corridoAmount: 5 } }
            });
            const updatedModel = newModel as BolitaModel;
            expect(updatedModel.isEditing).toBe(true);
            expect(updatedModel.entrySession.fijosCorridos).toHaveLength(1);
        });

        it('PRESS_ADD_PARLET should set isEditing to true', () => {
            const fijosCorridosList: FijosCorridosBet[] = [
                { id: '1', bet: 12, fijoAmount: 0, corridoAmount: 0 },
                { id: '2', bet: 34, fijoAmount: 0, corridoAmount: 0 }
            ];
            const model: BolitaModel = {
                ...initialBolitaModel,
                entrySession: {
                    ...initialBolitaModel.entrySession,
                    fijosCorridos: fijosCorridosList
                }
            };
            const [newModel] = updateParlet(model, {
                type: 'PRESS_ADD_PARLET',
                payload: { fijosCorridosList }
            });
            const updatedModel = newModel as BolitaModel;
            expect(updatedModel.isEditing).toBe(true);
        });

        it('PRESS_ADD_CENTENA should set isEditing to true', () => {
            const [newModel] = updateCentena(initialBolitaModel, { type: 'PRESS_ADD_CENTENA', payload: undefined });
            const updatedModel = newModel as BolitaModel;
            expect(updatedModel.isEditing).toBe(true);
            expect(updatedModel.editState.showBetKeyboard).toBe(true);
            expect(updatedModel.editState.activeOwner).toBe('centena');
        });
    });

    describe('PARLET_CONFIRM_INPUT', () => {
        it('should update parlet amount and set isEditing to true', () => {
            const existingParlet = { id: 'p-1', bets: ['12', '34'], amount: 0, type: 'parlet' as const };
            const model: BolitaModel = {
                ...initialBolitaModel,
                isEditing: false,
                entrySession: {
                    ...initialBolitaModel.entrySession,
                    parlets: [existingParlet]
                },
                editState: {
                    ...initialBolitaModel.editState,
                    showAmountKeyboard: true,
                    editingBetId: 'p-1',
                    currentInput: '100'
                }
            };

            const [newModel] = updateParlet(model, { type: 'PARLET_CONFIRM_INPUT', payload: undefined });
            const updatedModel = newModel as BolitaModel;

            expect(updatedModel.isEditing).toBe(true);
            expect(updatedModel.entrySession.parlets[0].amount).toBe(100);
            expect(updatedModel.editState.showAmountKeyboard).toBe(false);
        });
    });

    describe('PARLET Combinations Logic', () => {
        it('should create multiple parlets from combinations of fijos', () => {
            const fijos: FijosCorridosBet[] = [
                { id: '1', bet: 12, fijoAmount: 0, corridoAmount: 0 },
                { id: '2', bet: 15, fijoAmount: 0, corridoAmount: 0 },
                { id: '3', bet: 16, fijoAmount: 0, corridoAmount: 0 }
            ];
            const model: BolitaModel = {
                ...initialBolitaModel,
                entrySession: {
                    ...initialBolitaModel.entrySession,
                    fijosCorridos: fijos
                }
            };

            const [newModel] = updateParlet(model, {
                type: 'CONFIRM_PARLET_BET',
                payload: { numbers: [12, 15, 16] }
            });
            const updatedModel = newModel as BolitaModel;

            // Combinations of [12, 15, 16] are: [12, 15], [12, 16], [15, 16]
            expect(updatedModel.entrySession.parlets).toHaveLength(3);
            expect(updatedModel.entrySession.parlets.some(p => p.bets.includes(12) && p.bets.includes(15))).toBe(true);
            expect(updatedModel.entrySession.parlets.some(p => p.bets.includes(12) && p.bets.includes(16))).toBe(true);
            expect(updatedModel.entrySession.parlets.some(p => p.bets.includes(15) && p.bets.includes(16))).toBe(true);

            // Fijos should be marked as used
            expect(updatedModel.entrySession.fijosCorridos.every(f => f.usedInParlet)).toBe(true);
        });

        it('should create parlets from manual keyboard input (combinations)', () => {
            const model: BolitaModel = {
                ...initialBolitaModel,
                editState: {
                    ...initialBolitaModel.editState,
                    showBetKeyboard: true,
                    currentInput: '121516'
                }
            };

            const [newModel] = updateParlet(model, { type: 'PARLET_CONFIRM_INPUT', payload: undefined });
            const updatedModel = newModel as BolitaModel;

            expect(updatedModel.entrySession.parlets).toHaveLength(3);
            expect(updatedModel.editState.showBetKeyboard).toBe(false);
            expect(updatedModel.editState.currentInput).toBe('');
        });
    });

    describe('CENTENA_CONFIRM_INPUT', () => {
        it('should update centena amount and set isEditing to true', () => {
            const existingCentena = { id: 'c-1', bet: 123, amount: 0, type: 'centena' as const };
            const model: BolitaModel = {
                ...initialBolitaModel,
                isEditing: false,
                entrySession: {
                    ...initialBolitaModel.entrySession,
                    centenas: [existingCentena]
                },
                editState: {
                    ...initialBolitaModel.editState,
                    showAmountKeyboard: true,
                    editingBetId: 'c-1',
                    currentInput: '200'
                }
            };

            const [newModel] = updateCentena(model, { type: 'CENTENA_CONFIRM_INPUT', payload: undefined });
            const updatedModel = newModel as BolitaModel;

            expect(updatedModel.isEditing).toBe(true);
            expect(updatedModel.entrySession.centenas[0].amount).toBe(200);
            expect(updatedModel.editState.showAmountKeyboard).toBe(false);
        });
    });
});
