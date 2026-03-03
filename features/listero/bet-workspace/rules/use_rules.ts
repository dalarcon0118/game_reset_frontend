import { useBetWorkspaceStore } from '../core/store';
import * as RulesMsg from './core/types';

export const useRules = () => {
    const model = useBetWorkspaceStore((state) => state.model.rulesSession);
    const dispatch = useBetWorkspaceStore((state) => state.dispatch);

    const {
        rulesList,
        isRulesDrawerVisible,
        selectedRuleType,
        selectedRule,
        allRules,
        stats,
        currentDrawId,
        isRefreshing
    } = model;

    const fetchRules = (drawId: string) => dispatch({ type: 'RULES', payload: RulesMsg.FETCH_RULES_REQUESTED({ drawId }) });
    const refreshRules = (drawId: string) => dispatch({ type: 'RULES', payload: RulesMsg.REFRESH_RULES_REQUESTED({ drawId }) });
    const showRulesDrawer = (ruleType: 'validation' | 'reward', rule: any) => dispatch({ type: 'RULES', payload: RulesMsg.SHOW_RULES_DRAWER({ ruleType, rule }) });
    const hideRulesDrawer = () => dispatch({ type: 'RULES', payload: RulesMsg.HIDE_RULES_DRAWER() });
    const selectRule = (ruleType: 'validation' | 'reward', rule: any) => dispatch({ type: 'RULES', payload: RulesMsg.SELECT_RULE({ ruleType, rule }) });
    const clearSelection = () => dispatch({ type: 'RULES', payload: RulesMsg.CLEAR_SELECTION() });

    return {
        rulesList,
        allRules,
        stats,
        isRefreshing,
        currentDrawId,
        isRulesDrawerVisible,
        selectedRuleType,
        selectedRule,
        fetchRules,
        refreshRules,
        showRulesDrawer,
        hideRulesDrawer,
        selectRule,
        clearSelection,
    };
};