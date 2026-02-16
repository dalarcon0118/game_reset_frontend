import { ListMsgType } from '@/features/listero/bets/features/bet-list/list.types';

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
                type: ListMsgType.CLEAR_LIST
            }
        }
    }),
    refreshBets: (drawId: string) => ({
        type: 'MSG' as const,
        payload: {
            type: 'LIST' as const,
            payload: {
                type: ListMsgType.REFRESH_BETS_REQUESTED,
                drawId
            }
        }
    })
};
