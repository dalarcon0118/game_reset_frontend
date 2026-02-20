import { ListMsgType } from '@/features/bet-workspace/list/list.types';

/**
 * Generates a unique receipt code for bets
 */
export const generateReceiptCode = (): string => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
};

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
