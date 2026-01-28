import { useEffect, useMemo } from 'react';
import { useBetsStore, selectBetsModel, selectDispatch } from '../../core/store';
import { RewardsRulesMsgType } from './rewards.types';
import { WinningRecord } from '@/types';

interface WinningData {
    fullNumber: string;
    centena: string;
    fijo: string;
    corridos: string[];
    parlets: string[];
}

export const useRewards = (drawId: string) => {
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);

    const { rewards } = model;
    const { data: winningNumbers, isLoading, error } = rewards;

    useEffect(() => {
        dispatch({
            type: 'REWARDS_RULES',
            payload: { type: RewardsRulesMsgType.FETCH_REWARDS_REQUESTED, drawId }
        });
    }, [drawId, dispatch]);

    const winningData = useMemo<WinningData | null>(() => {
        if (!winningNumbers?.winning_number) return null;

        const parts = winningNumbers.winning_number.trim().split(/\s+/);
        if (parts.length === 0) return null;

        const firstNumber = parts[0];
        const otherNumbers = parts.slice(1);
        const centena = firstNumber.length >= 3 ? firstNumber.slice(-3) : firstNumber;
        const fijo = firstNumber.length >= 2 ? firstNumber.slice(-2) : firstNumber;
        const allNumbers = [fijo, ...otherNumbers];
        const parlets: string[] = [];

        for (let i = 0; i < allNumbers.length; i++) {
            for (let j = i + 1; j < allNumbers.length; j++) {
                parlets.push(`${allNumbers[i]} - ${allNumbers[j]}`);
            }
        }

        return {
            fullNumber: winningNumbers.winning_number,
            centena,
            fijo,
            corridos: otherNumbers,
            parlets
        };
    }, [winningNumbers]);

    const fetchRewards = () => {
        dispatch({
            type: 'REWARDS_RULES',
            payload: { type: RewardsRulesMsgType.FETCH_REWARDS_REQUESTED, drawId }
        });
    };

    return {
        winningNumbers,
        winningData,
        isLoading,
        error,
        fetchRewards,
    };
};

export const useRules = (drawId: string) => {
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);

    const { rules } = model;
    const { data: rulesData, isLoading, error } = rules;

    useEffect(() => {
        if (drawId) {
            dispatch({
                type: 'REWARDS_RULES',
                payload: { type: RewardsRulesMsgType.FETCH_RULES_REQUESTED, drawId }
            });
        }
    }, [drawId, dispatch]);

    const fetchRules = () => {
        dispatch({
            type: 'REWARDS_RULES',
            payload: { type: RewardsRulesMsgType.FETCH_RULES_REQUESTED, drawId }
        });
    };

    return {
        rulesData,
        isLoading,
        error,
        fetchRules,
    };
};
