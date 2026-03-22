import { LoteriaFeatureModel } from './core/feature.types';
import { calculateLoteriaFixedAmount } from './loteria/loteria.domain';

export const selectLoteriaList = (model: LoteriaFeatureModel) => {
    const { isEditing, entrySession, listSession } = model;

    const result = isEditing
        ? entrySession.loteria
        : (listSession.remoteData.type === 'Success'
            ? (listSession.remoteData as any).data.loteria
            : []);

    return result;
};

export const selectFixedAmount = (model: LoteriaFeatureModel) => {
    const { managementSession, rulesSession } = model;
    const loteriaBetTypeId = managementSession.betTypes.loteria;
    
    // 🛡️ Guardia defensiva: RulesModel (bet-workspace) usa rulesList, no status.
    // Se ajusta para usar la estructura real y evitar el crash "Cannot read property 'status' of undefined"
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
