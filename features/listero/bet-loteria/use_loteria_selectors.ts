import { LoteriaFeatureModel } from './core/feature.types';
import { calculateLoteriaFixedAmount } from './loteria/loteria.domain';
import { resolveLoteriaBetTypeId } from '@/shared/types/bet_types';

export const selectLoteriaList = (model: LoteriaFeatureModel) => {
    const { isEditing, entrySession, listSession } = model;

    const result = isEditing
        ? entrySession.loteria
        : (listSession.remoteData.type === 'Success'
            ? listSession.remoteData.data.loteria
            : []);

    return result;
};

export const selectFixedAmount = (model: LoteriaFeatureModel) => {
    const { managementSession, rulesSession } = model;

    const loteriaBetTypeId = managementSession.betTypes.type === 'Success'
        ? resolveLoteriaBetTypeId(managementSession.betTypes.data)
        : null;

    // 🛡️ Guardia defensiva: RulesModel (bet-workspace) usa rulesList, no status.
    const rulesList = rulesSession?.rulesList;
    const rulesData = rulesList?.type === 'Success' ? rulesList.data : null;
    const validationRules = rulesData?.validationRules || [];

    return calculateLoteriaFixedAmount(validationRules, loteriaBetTypeId);
};

export const selectDrawDetails = (model: LoteriaFeatureModel) => {
    const { managementSession } = model;
    return managementSession.drawDetails.type === 'Success'
        ? managementSession.drawDetails.data
        : null;
};
