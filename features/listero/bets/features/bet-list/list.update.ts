import { match } from 'ts-pattern';
import { ListMsgType, ListMsg, ListState, ListData } from './list.types';
import { Model } from '../../core/model';
import { Cmd } from '@/shared/core/cmd';
import { BetType } from '@/types';
import { Return, ret, singleton } from '@/shared/core/return';
import { RemoteData } from '@/shared/core/remote.data';
import { BetService } from '@/shared/services/bet';

const transformBetTypeToFijosCorridos = (bets: BetType[]): any[] => {
    console.log(`[transformBetTypeToFijosCorridos] Processing ${bets.length} bets`);
    const fijosCorridosMap = new Map<string, any>();

    bets.forEach((bet) => {
        console.log(`[transformBetTypeToFijosCorridos] Processing bet ID ${bet.id}, type: ${bet.type}, numbers: ${bet.numbers}`);
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
                    const key = `${number}-${bet.receiptCode || ''}`;
                    const existing = fijosCorridosMap.get(key);
                    if (existing) {
                        if (bet.type === 'Fijo') {
                            existing.fijoAmount = bet.amount;
                        } else if (bet.type === 'Corrido') {
                            existing.corridoAmount = bet.amount;
                        }
                    } else {
                        fijosCorridosMap.set(key, {
                            id: bet.id,
                            bet: number,
                            fijoAmount: bet.type === 'Fijo' ? bet.amount : null,
                            corridoAmount: bet.type === 'Corrido' ? bet.amount : null,
                            receiptCode: bet.receiptCode,
                        });
                    }
                }
            }
        } catch (e) {
            console.warn('Error parsing bet numbers:', bet.numbers, e);
        }
    });

    return Array.from(fijosCorridosMap.values()).sort((a, b) => {
        if (a.receiptCode !== b.receiptCode) {
            return (a.receiptCode || '').localeCompare(b.receiptCode || '');
        }
        return a.bet - b.bet;
    });
};

const transformBetTypeToParlets = (bets: BetType[]): any[] => {
    console.log(`[transformBetTypeToParlets] Processing ${bets.length} bets`);
    return bets
        .filter(bet => {
            const isParlet = bet.type === 'Parlet';
            if (!isParlet) console.log(`[transformBetTypeToParlets] Skipping bet ID ${bet.id} because type is ${bet.type}`);
            return isParlet;
        })
        .map((bet) => {
            console.log(`[transformBetTypeToParlets] Transforming parlet ID ${bet.id}, numbers: ${bet.numbers}`);
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
                    receiptCode: bet.receiptCode,
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
    console.log(`[transformBetTypeToCentenas] Processing ${bets.length} bets`);
    return bets
        .filter(bet => {
            // NOTE: Check if type name is Centena or if it is part of Fijo/Corrido logic in this project
            const isCentena = (bet.type as string) === 'Centena';
            if (!isCentena) console.log(`[transformBetTypeToCentenas] Skipping bet ID ${bet.id} because type is ${bet.type}`);
            return isCentena;
        })
        .map((bet) => {
            console.log(`[transformBetTypeToCentenas] Transforming centena ID ${bet.id}, numbers: ${bet.numbers}`);
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
                        receiptCode: bet.receiptCode,
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
    console.log(`[transformBetTypeToLoteria] Processing ${bets.length} bets`);
    return bets
        .filter(bet => {
            const isLoteria = (bet.type as string) === 'Loteria' || (bet.type as string) === 'Cuaterna Semanal';
            if (!isLoteria) console.log(`[transformBetTypeToLoteria] Skipping bet ID ${bet.id} because type is ${bet.type}`);
            return isLoteria;
        })
        .map((bet) => {
            console.log(`[transformBetTypeToLoteria] Transforming loteria ID ${bet.id}, numbers: ${bet.numbers}`);
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
        .with({ type: ListMsgType.FETCH_BETS_REQUESTED }, ({ drawId }: { drawId: string }) => {
            console.log('LIST FETCH_BETS_REQUESTED called with drawId:', drawId);

            // Si ya tenemos datos exitosos para ESTE sorteo específico, ignoramos para evitar parpadeos
            if (model.listSession.remoteData.type === 'Success' && model.listSession.loadedDrawId === drawId) {
                console.log('LIST FETCH_BETS_REQUESTED ignored (already have data for this draw)');
                return singleton(model);
            }

            const nextListSession: ListState = {
                ...model.listSession,
                remoteData: RemoteData.loading(),
            };
            return ret(
                {
                    ...model,
                    currentDrawId: drawId,
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
        .with({ type: ListMsgType.REFRESH_BETS_REQUESTED }, ({ drawId }: { drawId: string }) => {
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
        .with({ type: ListMsgType.FETCH_BETS_SUCCEEDED }, ({ fijosCorridos, parlets, centenas, loteria }: { fijosCorridos: any[], parlets: any[], centenas: any[], loteria: any[] }) => {
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
                    loadedDrawId: model.currentDrawId, // Marcamos el sorteo actual como cargado exitosamente
                },
            });
            console.log('LIST state updated to SUCCESS');
            return result;
        })
        .with({ type: ListMsgType.FETCH_BETS_FAILED }, ({ error }: { error: string }) => {
            return singleton({
                ...model,
                listSession: {
                    ...model.listSession,
                    remoteData: RemoteData.failure(error),
                    isRefreshing: false,
                },
            });
        })
        .with({ type: ListMsgType.REMOVE_BET }, ({ betId, category }: { betId: string, category: keyof ListData }) => {
            const nextRemoteData = RemoteData.map<any, ListData, ListData>((data: ListData) => {
                const updatedCategory = data[category].filter((bet: any) => bet.id !== betId);
                return {
                    ...data,
                    [category]: updatedCategory
                };
            }, model.listSession.remoteData);

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
                    loadedDrawId: null,
                },
            });
        })
        .with({ type: ListMsgType.UPDATE_LIST_FILTER }, ({ filter }: { filter: string }) => {
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
