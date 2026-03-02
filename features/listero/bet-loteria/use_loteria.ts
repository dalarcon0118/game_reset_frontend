import { useCallback, useMemo, useEffect } from 'react';
import { useLoteriaStore, selectLoteriaModel } from './core/store';
import { useLoteriaActions } from './use_loteria_actions';
import { selectLoteriaList, selectFixedAmount, selectDrawDetails } from './use_loteria_selectors';
import { useAuth } from '@features/auth';

export const useLoteria = (drawId?: string, isEditing: boolean = true) => {
    const model = useLoteriaStore(selectLoteriaModel);
    const actions = useLoteriaActions();
    const { user } = useAuth();

    // Obtener el structureId del usuario actual para el registro financiero
    const structureId = user?.structure?.id ? String(user.structure.id) : undefined;

    const {
        loteriaSession,
        editSession,
        listSession,
        summary
    } = model;

    // Derived data using selectors
    const loteriaList = useMemo(() => selectLoteriaList(model), [model]);
    const fixedAmount = useMemo(() => selectFixedAmount(model), [model]);
    const drawDetails = useMemo(() => selectDrawDetails(model), [model]);

    // Side effects (Initialization)
    useEffect(() => {
        if (drawId) {
            actions.init(drawId, isEditing, structureId);
        }
    }, [drawId, actions, isEditing, structureId]);

    // High level callbacks
    const handleSave = useCallback(() => {
        if (drawId) {
            actions.requestSave(drawId);
        }
    }, [drawId, actions]);

    return {
        // Data
        loteriaList,
        fixedAmount,
        drawDetails,
        isEditing: model.isEditing,
        isBetKeyboardVisible: loteriaSession.isBetKeyboardVisible,
        isAmountKeyboardVisible: loteriaSession.isAmountKeyboardVisible,
        currentInput: editSession.currentInput,

        // List status
        isRefreshing: listSession.isRefreshing,
        listStatus: listSession.remoteData.type,

        // Summary
        loteriaTotal: summary.loteriaTotal,
        hasBets: summary.hasBets,
        isSaving: summary.isSaving,
        error: summary.error,

        // Actions
        ...actions,
        handleSave,
    };
};

