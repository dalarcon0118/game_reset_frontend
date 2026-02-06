import { Model } from '../../core/model';
import { ParletBet } from '@/types';
import { generateRandomId } from '../../shared/utils/numbers';
import { RemoteData } from '@/shared/core/remote.data';

export const ParletDomain = {
    /**
     * Parses a string input into an array of 2-digit numbers.
     * Example: "1234" -> [12, 34]
     */
    parseInput: (input: string): number[] => {
        const chunks = input.match(/.{1,2}/g) || [];
        return chunks.map(chunk => parseInt(chunk, 10)).filter(n => !isNaN(n));
    },

    /**
     * Validates if the numbers form a valid parlet (at least 2 numbers).
     */
    isValid: (numbers: number[]): boolean => {
        return numbers.length >= 2;
    },

    /**
     * Creates a new ParletBet instance.
     */
    create: (numbers: number[]): ParletBet => {
        return {
            id: generateRandomId(),
            bets: numbers,
            amount: 0,
        };
    },

    /**
     * Helper to apply a transformation to the parlet list, handling the storage strategy (Entry vs List).
     */
    modifyParletList: (model: Model, transform: (parlets: ParletBet[]) => ParletBet[]): Model => {
        if (model.isEditing) {
            return {
                ...model,
                entrySession: {
                    ...model.entrySession,
                    parlets: transform(model.entrySession.parlets)
                }
            };
        } else {
            const nextRemoteData = RemoteData.map((data: any) => ({
                ...data,
                parlets: transform(data.parlets),
            }), model.listSession.remoteData);

            return {
                ...model,
                listSession: {
                    ...model.listSession,
                    remoteData: nextRemoteData,
                }
            };
        }
    },

    /**
     * Adds a parlet to the model.
     */
    addToState: (model: Model, parlet: ParletBet): Model => {
        return ParletDomain.modifyParletList(model, (list) => [...list, parlet]);
    },

    /**
     * Updates a parlet in the model.
     */
    updateInState: (model: Model, betId: string, changes: Partial<ParletBet>): Model => {
        return ParletDomain.modifyParletList(model, (list) => 
            list.map(p => p.id === betId ? { ...p, ...changes } : p)
        );
    },

    /**
     * Deletes a parlet from the model.
     */
    deleteFromState: (model: Model, betId: string): Model => {
        return ParletDomain.modifyParletList(model, (list) => 
            list.filter(p => p.id !== betId)
        );
    },

    /**
     * Finds a parlet in the model, regardless of storage location.
     */
    findInState: (model: Model, betId: string): ParletBet | undefined => {
        if (model.isEditing) {
            return model.entrySession.parlets.find(p => p.id === betId);
        } else {
            return model.listSession.remoteData.type === 'Success'
                ? model.listSession.remoteData.data.parlets.find((p: ParletBet) => p.id === betId)
                : undefined;
        }
    }
};
