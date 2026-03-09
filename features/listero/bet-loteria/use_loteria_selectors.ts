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
    const { managementSession, rules } = model;
    const loteriaBetTypeId = managementSession.betTypes.loteria;
    const rulesData = rules.status.type === 'Success' ? rules.status.data : null;
    const validationRules = rulesData?.validation_rules || [];

    return calculateLoteriaFixedAmount(validationRules, loteriaBetTypeId);
};

export const selectDrawDetails = (model: LoteriaFeatureModel) => {
    const { managementSession } = model;
    return managementSession.drawDetails.type === 'Success'
        ? managementSession.drawDetails.data
        : null;
};
