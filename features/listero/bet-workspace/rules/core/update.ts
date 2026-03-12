import { match } from 'ts-pattern';
import { RulesModel } from './model';
import { RulesMsg, FETCH_RULES_REQUESTED, REFRESH_RULES_REQUESTED, FETCH_RULES_SUCCEEDED, FETCH_RULES_FAILED, SHOW_RULES_DRAWER, HIDE_RULES_DRAWER, SELECT_RULE, CLEAR_SELECTION } from './types';
import { Cmd, Return, ret, singleton, RemoteData } from '@core/tea-utils';

export interface RulesContextModel {
    rulesSession: RulesModel;
}

export const updateRules = <M extends RulesContextModel>(model: M, msg: RulesMsg): Return<M, RulesMsg> => {
    return match<RulesMsg, Return<M, RulesMsg>>(msg)
        .with({ type: FETCH_RULES_REQUESTED.toString() }, ({ payload: { drawId } }) => {
            return ret(
                {
                    ...model,
                    rulesSession: {
                        ...model.rulesSession,
                        rulesList: RemoteData.loading(),
                        currentDrawId: drawId,
                    }
                },
                Cmd.http(
                    { url: `/draw/draws/${drawId}/rules-for-current-user/` },
                    (response: any) => FETCH_RULES_SUCCEEDED({
                        validationRules: response?.validation_rules || [],
                        rewardRules: response?.reward_rules || [],
                        structureName: response?.structure_name || '',
                        drawName: response?.draw_name || '',
                    }),
                    (error: any) => FETCH_RULES_FAILED({ error })
                )
            );
        })
        .with({ type: REFRESH_RULES_REQUESTED.toString() }, ({ payload: { drawId } }) => {
            return ret(
                {
                    ...model,
                    rulesSession: {
                        ...model.rulesSession,
                        isRefreshing: true,
                        currentDrawId: drawId,
                    }
                },
                Cmd.http(
                    { url: `/draw/draws/${drawId}/rules-for-current-user/` },
                    (response: any) => FETCH_RULES_SUCCEEDED({
                        validationRules: response?.validation_rules || [],
                        rewardRules: response?.reward_rules || [],
                        structureName: response?.structure_name || '',
                        drawName: response?.draw_name || '',
                    }),
                    (error: any) => FETCH_RULES_FAILED({ error })
                )
            );
        })
        .with({ type: FETCH_RULES_SUCCEEDED.toString() }, ({ payload: data }) => {
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
                }
            });
        })
        .with({ type: FETCH_RULES_FAILED.toString() }, ({ payload: { error } }) => {
            return singleton({
                ...model,
                rulesSession: {
                    ...model.rulesSession,
                    rulesList: RemoteData.failure(error),
                    isRefreshing: false,
                }
            });
        })
        .with({ type: SHOW_RULES_DRAWER.toString() }, ({ payload: { ruleType, rule } }) => {
            return singleton({
                ...model,
                rulesSession: {
                    ...model.rulesSession,
                    isRulesDrawerVisible: true,
                    selectedRuleType: ruleType,
                    selectedRule: rule,
                }
            });
        })
        .with({ type: HIDE_RULES_DRAWER.toString() }, () => {
            return singleton({
                ...model,
                rulesSession: {
                    ...model.rulesSession,
                    isRulesDrawerVisible: false,
                }
            });
        })
        .with({ type: SELECT_RULE.toString() }, ({ payload: { ruleType, rule } }) => {
            return singleton({
                ...model,
                rulesSession: {
                    ...model.rulesSession,
                    selectedRuleType: ruleType,
                    selectedRule: rule,
                }
            });
        })
        .with({ type: CLEAR_SELECTION.toString() }, () => {
            return singleton({
                ...model,
                rulesSession: {
                    ...model.rulesSession,
                    selectedRuleType: null,
                    selectedRule: null,
                }
            });
        })
        .otherwise(() => singleton(model));
};
