import { LoteriaFeatureModel } from './core/feature.types';
import { calculateLoteriaFixedAmount } from './loteria/loteria.domain';

export const selectLoteriaList = (model: LoteriaFeatureModel) => {
    const { isEditing, entrySession, listSession } = model;

    // DEBUG: Log detailed info about remoteData structure
    const isSuccess = listSession.remoteData.type === 'Success';
    const remoteDataData = isSuccess ? (listSession.remoteData as any).data : null;
    const dataKeys = remoteDataData ? Object.keys(remoteDataData) : [];

    console.log('[LoteriaColumn selectLoteriaList DEBUG]:', {
        isEditing,
        listStatus: listSession.remoteData.type,
        isSuccess,
        dataKeys,
        dataLoteriaLength: isSuccess ? remoteDataData?.loteria?.length : 0,
        remoteDataDataType: remoteDataData ? typeof remoteDataData : 'N/A'
    });

    const result = isEditing
        ? entrySession.loteria
        : (listSession.remoteData.type === 'Success'
            ? (listSession.remoteData as any).data.loteria
            : []);

    // DEBUG: Log result
    console.log('[LoteriaColumn selectLoteriaList RESULT]:', {
        resultLength: result?.length || 0,
        firstItem: result?.[0]
    });

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
