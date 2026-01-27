import { match } from 'ts-pattern';
import { Model } from '../../core/model';
import { ListMsgType, ListMsg, ListState } from './list.types';
import { Cmd } from '@/shared/core/cmd';
import { BetType } from '@/types';
import { Return, ret, singleton } from '@/shared/core/return';
import { RemoteData } from '@/shared/core/remote.data';
import { BetService } from '@/shared/services/bet';

const transformBetTypeToFijosCorridos = (bets: BetType[]): any[] => {
    const fijosCorridosMap = new Map<number, any>();

    bets.forEach((bet) => {
        try {
            let parsedNumbers: any;
            try {
                parsedNumbers = JSON.parse(bet.numbers);
            } catch {
                parsedNumbers = bet.numbers;
            }

            const extractSingleNumber = (val: any): number | null => {
                if (typeof val === 'number') return val;
                if (typeof val === 'string') {
                    const n = parseInt(val, 10);
                    return isNaN(n) ? null : n;
                }
                if (Array.isArray(val) && val.length > 0) {
                    const first = val[0];
                    const n = typeof first === 'number' ? first : parseInt(first, 10);
                    return isNaN(n) ? null : n;
                }
                if (val && typeof val === 'object') {
                    if ('number' in val) return extractSingleNumber(val.number);
                    if ('bet' in val) return extractSingleNumber(val.bet);
                }
                return null;
            };

            if (bet.type === 'Fijo' || bet.type === 'Corrido') {
                const number = extractSingleNumber(parsedNumbers);

                if (number !== null && !isNaN(number)) {
                    const existing = fijosCorridosMap.get(number);
                    if (existing) {
                        if (bet.type === 'Fijo') {
                            existing.fijoAmount = bet.amount;
                        } else if (bet.type === 'Corrido') {
                            existing.corridoAmount = bet.amount;
                        }
                    } else {
                        fijosCorridosMap.set(number, {
                            id: bet.id,
                            bet: number,
                            fijoAmount: bet.type === 'Fijo' ? bet.amount : null,
                            corridoAmount: bet.type === 'Corrido' ? bet.amount : null,
                        });
                    }
                }
            }
        } catch (e) {
            console.warn('Error parsing bet numbers:', bet.numbers, e);
        }
    });

    return Array.from(fijosCorridosMap.values()).sort((a, b) => a.bet - b.bet);
};

const transformBetTypeToParlets = (bets: BetType[]): any[] => {
    return bets
        .filter(bet => bet.type === 'Parlet')
        .map((bet) => {
            try {
                let parsedNumbers: any;
                try {
                    parsedNumbers = JSON.parse(bet.numbers);
                } catch {
                    parsedNumbers = bet.numbers;
                }

                const extractNumberArray = (val: any): number[] => {
                    const toNum = (x: any) => (typeof x === 'number' ? x : parseInt(x, 10));
                    if (typeof val === 'string') {
                        if (val.includes('-')) {
                            return val.split('-').map(s => parseInt(s, 10)).filter((n: number) => !isNaN(n));
                        }
                        const n = parseInt(val, 10);
                        return isNaN(n) ? [] : [n];
                    }
                    if (Array.isArray(val)) return val.map(toNum).filter((n: number) => !isNaN(n));
                    if (val && typeof val === 'object') {
                        if (Array.isArray(val.numbers)) return val.numbers.map(toNum).filter((n: number) => !isNaN(n));
                        if (Array.isArray(val.pair)) return val.pair.map(toNum).filter((n: number) => !isNaN(n));
                    }
                    return [];
                };

                const numbers = extractNumberArray(parsedNumbers);

                return {
                    id: bet.id,
                    bets: numbers,
                    amount: bet.amount,
                };
            } catch (e) {
                console.warn('Error parsing parlet bet:', bet.numbers, e);
                return null;
            }
        })
        .filter((bet): bet is NonNullable<typeof bet> => bet !== null)
        .sort((a, b) => {
            if (a.amount === b.amount) {
                const aKey = a.bets.join('-');
                const bKey = b.bets.join('-');
                return aKey.localeCompare(bKey);
            }
            return (a.amount || 0) - (b.amount || 0);
        });
};

const transformBetTypeToCentenas = (bets: BetType[]): any[] => {
    return bets
        .filter(bet => (bet.type as string) === 'Centena')
        .map((bet) => {
            try {
                let parsedNumbers: any;
                try {
                    parsedNumbers = JSON.parse(bet.numbers);
                } catch {
                    parsedNumbers = bet.numbers;
                }

                const extractSingleNumber = (val: any): number | null => {
                    if (typeof val === 'number') return val;
                    if (typeof val === 'string') {
                        const n = parseInt(val, 10);
                        return isNaN(n) ? null : n;
                    }
                    if (Array.isArray(val) && val.length > 0) {
                        const first = val[0];
                        const n = typeof first === 'number' ? first : parseInt(first, 10);
                        return isNaN(n) ? null : n;
                    }
                    if (val && typeof val === 'object') {
                        if ('number' in val) return extractSingleNumber(val.number);
                        if ('bet' in val) return extractSingleNumber(val.bet);
                    }
                    return null;
                };

                const number = extractSingleNumber(parsedNumbers);

                if (number !== null && !isNaN(number)) {
                    return {
                        id: bet.id,
                        bet: number,
                        amount: bet.amount,
                    };
                }
            } catch (e) {
                console.warn('Error parsing centena bet:', bet.numbers, e);
            }
            return null;
        })
        .filter((bet): bet is NonNullable<typeof bet> => bet !== null)
        .sort((a: any, b: any) => {
            if (a.amount === b.amount) return a.bet - b.bet;
            return (a.amount || 0) - (b.amount || 0);
        });
};

const transformBetTypeToLoteria = (bets: BetType[]): any[] => {
    return bets
        .filter(bet => (bet.type as string) === 'Loteria' || (bet.type as string) === 'Cuaterna Semanal')
        .map((bet) => {
            try {
                let parsedNumbers: any;
                try {
                    parsedNumbers = JSON.parse(bet.numbers);
                } catch {
                    parsedNumbers = bet.numbers;
                }

                const extractSingleNumber = (val: any): number | null => {
                    if (typeof val === 'number') return val;
                    if (typeof val === 'string') {
                        const n = parseInt(val, 10);
                        return isNaN(n) ? null : n;
                    }
                    if (Array.isArray(val) && val.length > 0) {
                        const first = val[0];
                        const n = typeof first === 'number' ? first : parseInt(first, 10);
                        return isNaN(n) ? null : n;
                    }
                    if (val && typeof val === 'object') {
                        if ('number' in val) return extractSingleNumber(val.number);
                        if ('bet' in val) return extractSingleNumber(val.bet);
                    }
                    return null;
                };

                const number = extractSingleNumber(parsedNumbers);

                if (number !== null && !isNaN(number)) {
                    return {
                        id: bet.id,
                        bet: number,
                        amount: bet.amount,
                    };
                }
            } catch (e) {
                console.warn('Error parsing loteria bet:', bet.numbers, e);
            }
            return null;
        })
        .filter((bet): bet is NonNullable<typeof bet> => bet !== null)
        .sort((a: any, b: any) => {
            if (a.amount === b.amount) return a.bet - b.bet;
            return (a.amount || 0) - (b.amount || 0);
        });
};

export const updateList = (model: Model, msg: ListMsg): Return<Model, ListMsg> => {
    return match<ListMsg, Return<Model, ListMsg>>(msg)
        .with({ type: ListMsgType.FETCH_BETS_REQUESTED }, ({ drawId }) => {
            console.log('LIST FETCH_BETS_REQUESTED called with drawId:', drawId);
            const nextListSession: ListState = {
                ...model.listSession,
                remoteData: RemoteData.loading(),
            };
            return ret(
                {
                    ...model,
                    drawId,
                    listSession: nextListSession,
                },
                Cmd.task(
                    {
                        task: BetService.list,
                        args: [{ drawId }],
                        onSuccess: (bets: BetType[]) => {
                            console.log('LIST FETCH_BETS_SUCCEEDED received bets:', bets?.length || 0);
                            const fijosCorridos = transformBetTypeToFijosCorridos(bets);
                            const parlets = transformBetTypeToParlets(bets);
                            const centenas = transformBetTypeToCentenas(bets);
                            const loteria = transformBetTypeToLoteria(bets);
                            console.log('Transformed data:', { fijosCorridos, parlets, centenas, loteria });
                            return {
                                type: ListMsgType.FETCH_BETS_SUCCEEDED,
                                fijosCorridos,
                                parlets,
                                centenas,
                                loteria
                            };
                        },
                        onFailure: (error: any) => {
                            console.log('LIST FETCH_BETS_FAILED error:', error);
                            return {
                                type: ListMsgType.FETCH_BETS_FAILED,
                                error: error.message || 'Error al cargar apuestas'
                            };
                        }
                    }
                )
            );
        })
        .with({ type: ListMsgType.REFRESH_BETS_REQUESTED }, ({ drawId }) => {
            console.log('list.update: REFRESH_BETS_REQUESTED for drawId', drawId);
            const nextListSession: ListState = {
                ...model.listSession,
                isRefreshing: true,
            };
            return ret(
                {
                    ...model,
                    listSession: nextListSession,
                },
                Cmd.task(
                    {
                        task: BetService.list,
                        args: [{ drawId }],
                        onSuccess: (bets: BetType[]) => {
                            console.log('list.update: FETCH_BETS_SUCCEEDED (refresh)');
                            return {
                                type: ListMsgType.FETCH_BETS_SUCCEEDED,
                                fijosCorridos: transformBetTypeToFijosCorridos(bets),
                                parlets: transformBetTypeToParlets(bets),
                                centenas: transformBetTypeToCentenas(bets),
                                loteria: transformBetTypeToLoteria(bets)
                            };
                        },
                        onFailure: (error: any) => {
                            console.log('list.update: FETCH_BETS_FAILED (refresh)', error);
                            return {
                                type: ListMsgType.FETCH_BETS_FAILED,
                                error: error.message || 'Error al actualizar apuestas'
                            };
                        }
                    }
                )
            );
        })
        .with({ type: ListMsgType.FETCH_BETS_SUCCEEDED }, ({ fijosCorridos, parlets, centenas, loteria }) => {
            console.log('LIST FETCH_BETS_SUCCEEDED processed:', { fijosCorridos, parlets, centenas, loteria });
            const result = singleton({
                ...model,
                listSession: {
                    ...model.listSession,
                    remoteData: RemoteData.success({
                        fijosCorridos,
                        parlets,
                        centenas,
                        loteria
                    }),
                    isRefreshing: false,
                },
            });
            console.log('LIST state updated to SUCCESS');
            return result;
        })
        .with({ type: ListMsgType.FETCH_BETS_FAILED }, ({ error }) => {
            return singleton({
                ...model,
                listSession: {
                    ...model.listSession,
                    remoteData: RemoteData.failure(error),
                    isRefreshing: false,
                },
            });
        })
        .with({ type: ListMsgType.REMOVE_BET }, ({ betId, category }) => {
            const nextRemoteData = RemoteData.map<any, ListData, ListData>((data) => ({
                ...data,
                [category]: data[category].filter((bet: any) => bet.id !== betId)
            }), model.listSession.remoteData);

            return singleton({
                ...model,
                listSession: {
                    ...model.listSession,
                    remoteData: nextRemoteData,
                },
            });
        })
        .with({ type: ListMsgType.CLEAR_LIST }, () => {
            const emptyData: ListData = {
                fijosCorridos: [],
                parlets: [],
                centenas: [],
                loteria: []
            };
            return singleton({
                ...model,
                listSession: {
                    ...model.listSession,
                    remoteData: RemoteData.success<any, ListData>(emptyData),
                },
            });
        })
        .with({ type: ListMsgType.UPDATE_LIST_FILTER }, ({ filter }) => {
            return singleton({
                ...model,
                listSession: {
                    ...model.listSession,
                    aliasFilter: filter,
                },
            });
        })
        .exhaustive();
};
