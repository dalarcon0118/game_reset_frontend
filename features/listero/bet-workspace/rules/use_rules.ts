import { useRulesStore, selectRulesModel, selectRulesDispatch } from './core/store';
import * as RulesMsg from './core/types';

export const useRules = () => {
    const model = useRulesStore(selectRulesModel);
    const dispatch = useRulesStore(selectRulesDispatch);

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

    const fetchRules = (drawId: string) => dispatch(RulesMsg.FETCH_RULES_REQUESTED({ drawId }));
    const refreshRules = (drawId: string) => dispatch(RulesMsg.REFRESH_RULES_REQUESTED({ drawId }));
    const showRulesDrawer = (ruleType: 'validation' | 'reward', rule: any) => dispatch(RulesMsg.SHOW_RULES_DRAWER({ ruleType, rule }));
    const hideRulesDrawer = () => dispatch(RulesMsg.HIDE_RULES_DRAWER());
    const selectRule = (ruleType: 'validation' | 'reward', rule: any) => dispatch(RulesMsg.SELECT_RULE({ ruleType, rule }));
    const clearSelection = () => dispatch(RulesMsg.CLEAR_SELECTION());

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