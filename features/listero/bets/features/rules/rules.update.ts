import { match } from 'ts-pattern';
import { Model as GlobalModel } from '../../core/model';
import { RulesMsgType, RulesMsg } from './rules.types';
import { Cmd } from '@/shared/core/cmd';
import { Return, ret, singleton } from '@/shared/core/return';
import { RemoteData } from '@/shared/core/remote.data';

// Initial state for this submodule
export const initRules = (model: GlobalModel): Return<GlobalModel, RulesMsg> => {
    return singleton({
        ...model,
        rulesSession: {
            ...model.rulesSession,
            rulesList: RemoteData.loading(),
            isRulesDrawerVisible: false,
            selectedRuleType: null,
            selectedRule: null,
        },
    });
};

export const updateRules = (model: GlobalModel, msg: RulesMsg): Return<GlobalModel, RulesMsg> => {
    return match<RulesMsg, Return<GlobalModel, RulesMsg>>(msg)
        .with({ type: RulesMsgType.FETCH_RULES_REQUESTED }, ({ drawId }) => {
            return ret(
                {
                    ...model,
                    rulesSession: {
                        ...model.rulesSession,
                        rulesList: RemoteData.loading(),
                        currentDrawId: drawId,
                    },
                },
                Cmd.http(
                    { url: `/draw/draws/${drawId}/rules-for-current-user/` },
                    (response: any) => ({
                        type: RulesMsgType.FETCH_RULES_SUCCEEDED,
                        data: {
                            validationRules: response?.validation_rules || [],
                            rewardRules: response?.reward_rules || [],
                            structureName: response?.structure_name || '',
                            drawName: response?.draw_name || '',
                        },
                    }),
                    (error: any) => ({
                        type: RulesMsgType.FETCH_RULES_FAILED,
                        error,
                    })
                )
            );
        })
        .with({ type: RulesMsgType.REFRESH_RULES_REQUESTED }, ({ drawId }) => {
            return ret(
                {
                    ...model,
                    rulesSession: {
                        ...model.rulesSession,
                        isRefreshing: true,
                        currentDrawId: drawId,
                    },
                },
                Cmd.http(
                    { url: `/draw/draws/${drawId}/rules-for-current-user/` },
                    (response: any) => ({
                        type: RulesMsgType.FETCH_RULES_SUCCEEDED,
                        data: {
                            validationRules: response?.validation_rules || [],
                            rewardRules: response?.reward_rules || [],
                            structureName: response?.structure_name || '',
                            drawName: response?.draw_name || '',
                        },
                    }),
                    (error: any) => ({
                        type: RulesMsgType.FETCH_RULES_FAILED,
                        error,
                    })
                )
            );
        })
        .with({ type: RulesMsgType.FETCH_RULES_SUCCEEDED }, ({ data }) => {
            const validationRules = (data.validationRules || []).map((rule) => ({ ...rule, type: 'validation' as const }));
            const rewardRules = (data.rewardRules || []).map((rule) => ({ ...rule, type: 'reward' as const }));
            const allRules = [...validationRules, ...rewardRules].sort((a, b) =>
                new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            );

            const stats = {
                validationCount: validationRules.length,
                rewardCount: rewardRules.length,
                total: allRules.length,
            };

            return singleton({
                ...model,
                rulesSession: {
                    ...model.rulesSession,
                    rulesList: RemoteData.success(data),
                    allRules,
                    stats,
                    isRefreshing: false,
                },
            });
        })
        .with({ type: RulesMsgType.FETCH_RULES_FAILED }, ({ error }) => {
            return singleton({
                ...model,
                rulesSession: {
                    ...model.rulesSession,
                    rulesList: RemoteData.failure(error),
                    isRefreshing: false,
                },
            });
        })
        .with({ type: RulesMsgType.SHOW_RULES_DRAWER }, ({ ruleType, rule }) => {
            return singleton({
                ...model,
                rulesSession: {
                    ...model.rulesSession,
                    isRulesDrawerVisible: true,
                    selectedRuleType: ruleType,
                    selectedRule: rule,
                },
            });
        })
        .with({ type: RulesMsgType.HIDE_RULES_DRAWER }, () => {
            return singleton({
                ...model,
                rulesSession: {
                    ...model.rulesSession,
                    isRulesDrawerVisible: false,
                    selectedRuleType: null,
                    selectedRule: null,
                },
            });
        })
        .with({ type: RulesMsgType.SELECT_RULE }, ({ ruleType, rule }) => {
            return singleton({
                ...model,
                rulesSession: {
                    ...model.rulesSession,
                    selectedRuleType: ruleType,
                    selectedRule: rule,
                },
            });
        })
        .with({ type: RulesMsgType.CLEAR_SELECTION }, () => {
            return singleton({
                ...model,
                rulesSession: {
                    ...model.rulesSession,
                    selectedRuleType: null,
                    selectedRule: null,
                },
            });
        })
        .exhaustive();
};
