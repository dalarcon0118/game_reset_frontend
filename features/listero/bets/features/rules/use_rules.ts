import { useBetsStore, selectBetsModel, selectDispatch } from '../../core/store';
import { RulesMsgType } from './rules.types';

export const useRules = () => {
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);

    const {
        rulesSession,
    } = model;

    const {
        rulesList,
        isRulesDrawerVisible,
        selectedRuleType,
        selectedRule,
    } = rulesSession;

    const fetchRules = (drawId: string) => dispatch({ type: 'RULES', payload: { type: RulesMsgType.FETCH_RULES_REQUESTED, drawId } });
    const refreshRules = (drawId: string) => dispatch({ type: 'RULES', payload: { type: RulesMsgType.REFRESH_RULES_REQUESTED, drawId } });
    const showRulesDrawer = (ruleType: 'validation' | 'reward', rule: any) => dispatch({ type: 'RULES', payload: { type: RulesMsgType.SHOW_RULES_DRAWER, ruleType, rule } });
    const hideRulesDrawer = () => dispatch({ type: 'RULES', payload: { type: RulesMsgType.HIDE_RULES_DRAWER } });
    const selectRule = (ruleType: 'validation' | 'reward', rule: any) => dispatch({ type: 'RULES', payload: { type: RulesMsgType.SELECT_RULE, ruleType, rule } });
    const clearSelection = () => dispatch({ type: 'RULES', payload: { type: RulesMsgType.CLEAR_SELECTION } });

    return {
        rulesList,
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