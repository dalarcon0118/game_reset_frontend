import { useCallback, useMemo, useEffect } from 'react';
import { useLoteriaStore, useLoteriaModel, selectLoteriaModel, useLoteriaDispatch } from './core/store';
import { useLoteriaActions } from './use_loteria_actions';
import { selectLoteriaList, selectFixedAmount, selectDrawDetails } from './use_loteria_selectors';
import { useAuth } from '@features/auth';
import * as RulesMsg from '../bet-workspace/rules/core/types';

export const useLoteria = (drawId?: string, isEditing: boolean = true) => {
    const model = useLoteriaModel();
    const actions = useLoteriaActions();
    const dispatch = useLoteriaDispatch();
    const { user } = useAuth();

    // Obtener el structureId del usuario actual para el registro financiero
    const structureId = user?.structure?.id ? String(user.structure.id) : undefined;

  const {
    loteriaSession,
    editSession,
    listSession,
    summary,
    rulesSession,
    managementSession
  } = model;

    // Derived data using selectors
    const loteriaList = useMemo(() => selectLoteriaList(model), [model]);
    const fixedAmount = useMemo(() => selectFixedAmount(model), [model]);
    const drawDetails = useMemo(() => selectDrawDetails(model), [model]);

    const isCatalogReady = managementSession.betTypes.type === 'Success';

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

    // Rules Actions (🛡️ Guardas defensivas para evitar crash si rulesSession no está listo)
    const fetchRules = useCallback((id: string) => {
        if (!dispatch) return;
        dispatch(RulesMsg.FETCH_RULES_REQUESTED({ drawId: id }));
    }, [dispatch]);

    const refreshRules = useCallback((id: string) => {
        if (!dispatch) return;
        dispatch(RulesMsg.REFRESH_RULES_REQUESTED({ drawId: id }));
    }, [dispatch]);

    const showRulesDrawer = useCallback((ruleType: 'validation' | 'reward', rule: any) => {
        if (!dispatch) return;
        dispatch(RulesMsg.SHOW_RULES_DRAWER({ ruleType, rule }));
    }, [dispatch]);

    const hideRulesDrawer = useCallback(() => {
        if (!dispatch) return;
        dispatch(RulesMsg.HIDE_RULES_DRAWER());
    }, [dispatch]);

    const selectRule = useCallback((ruleType: 'validation' | 'reward', rule: any) => {
        if (!dispatch) return;
        dispatch(RulesMsg.SELECT_RULE({ ruleType, rule }));
    }, [dispatch]);

    const clearSelection = useCallback(() => {
        if (!dispatch) return;
        dispatch(RulesMsg.CLEAR_SELECTION());
    }, [dispatch]);

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

    // Catalog readiness
    isCatalogReady,

    // Rules Session
    rulesSession,

        // Actions
        ...actions,
        handleSave,

        // Rules Actions
        fetchRules,
        refreshRules,
        showRulesDrawer,
        hideRulesDrawer,
        selectRule,
        clearSelection,
    };
};

