import { LoteriaFeatureModel, initialEditSession, initialListSession, initialEntrySession, initialManagementSession } from './feature.types';
import { initialLoteriaState, OPEN_BET_KEYBOARD } from '../loteria/loteria.types';
import { RemoteData } from '@core/tea-utils';
import { updateFeature } from './feature.update';

describe('Loteria Feature Orchestration', () => {
    const createInitialModel = (): LoteriaFeatureModel => ({
        currentDrawId: '1',
        drawTypeCode: RemoteData.success('loteria'),
        isEditing: true,
        summary: {
            loteriaTotal: 0,
            hasBets: false,
            isSaving: false,
            error: null,
            pendingReceiptCode: null,
        },
        loteriaSession: initialLoteriaState,
        editSession: {
            ...initialEditSession,
            currentInput: '123' // Simulate some existing input
        },
        listSession: initialListSession,
        entrySession: initialEntrySession,
        managementSession: initialManagementSession,
        rules: {
            status: RemoteData.notAsked(),
            lastUpdated: null
        }
    });

    it('should reset input AND open keyboard when OPEN_BET_KEYBOARD is received', () => {
        const model = createInitialModel();
        const msg = { type: 'LOTERIA' as const, payload: OPEN_BET_KEYBOARD() };

        const [updatedModel] = updateFeature(model, msg);

        // 1. Check if input was reset (Orchestration logic)
        expect(updatedModel.editSession.currentInput).toBe('');

        // 2. Check if keyboard is now visible (UI Delegation logic)
        expect(updatedModel.loteriaSession.isBetKeyboardVisible).toBe(true);
    });
});
