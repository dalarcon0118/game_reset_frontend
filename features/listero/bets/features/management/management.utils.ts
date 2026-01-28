import { GameType } from '@/types';
import { Model as GlobalModel } from '../../core/model';

import { ListMsgType } from '../bet-list/list.types';

/**
 * Action factories for interacting with the LIST feature.
 * Decouples management from list internal message structure.
 */
export const ListActions = {
    fetchBets: (drawId: string) => ({
        type: 'MSG' as const,
        payload: {
            type: 'LIST' as const,
            payload: {
                type: ListMsgType.FETCH_BETS_REQUESTED,
                drawId
            }
        }
    }),
    resetBets: () => ({
        type: 'MSG' as const,
        payload: {
            type: 'LIST' as const,
            payload: {
                type: ListMsgType.FETCH_BETS_SUCCEEDED,
                fijosCorridos: [],
                parlets: [],
                centenas: [],
                loteria: []
            }
        }
    })
};

/**
 * Identifies bet types from a list of available game types based on their names or codes.
 */
export const identifyBetTypes = (betTypes: GameType[]) => {
    const findType = (names: string[]) => {
        const type = betTypes.find(t => {
            const tName = (t.name || '').toUpperCase();
            const tCode = (t.code || '').toUpperCase();
            return names.some(name => {
                const searchName = name.toUpperCase();
                return tName.includes(searchName) || tCode === searchName;
            });
        });
        return type?.id?.toString() || null;
    };

    return {
        fijo: findType(['FIJO']),
        corrido: findType(['CORRIDO']),
        parlet: findType(['PARLET']),
        centena: findType(['CENTENA']),
        loteria: findType(['LOTERIA', 'LOTERÍA', 'CUATERNA', 'LS_WEEKLY', 'SEMANAL']),
    };
};

/**
 * Selects the current bet list data from the global model.
 */
export const selectListData = (model: GlobalModel) => {
    return model.listSession.remoteData.type === 'Success'
        ? model.listSession.remoteData.data
        : { fijosCorridos: [], parlets: [], centenas: [], loteria: [] };
};
