import { useEffect, useCallback, useState, useMemo } from 'react';
import { useAuth } from '../../../auth';
import { useDashboardStore, selectDraws, selectSummary, selectDispatch } from '../store';
import {
    FETCH_DATA_REQUESTED,
    REFRESH_CLICKED,
    SET_USER_STRUCTURE,
    RULES_CLICKED,
    REWARDS_CLICKED,
    BETS_LIST_CLICKED,
    CREATE_BET_CLICKED,
    NAVIGATE_TO_ERROR
} from '../store/types';

export const useDashboard = () => {
    const { user } = useAuth();
    const draws = useDashboardStore(selectDraws);
    const summary = useDashboardStore(selectSummary);
    const dispatch = useDashboardStore(selectDispatch);
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed' | 'closing_soon'>('all');

    useEffect(() => {
        if (user?.structure?.id) {
            dispatch(SET_USER_STRUCTURE(user.structure.id.toString()));
            dispatch(FETCH_DATA_REQUESTED());
        }
    }, [user?.structure?.id, dispatch]);

    const refresh = useCallback(() => {
        dispatch(REFRESH_CLICKED());
    }, [dispatch]);

    const goToRules = useCallback((drawId: string) => {
        dispatch(RULES_CLICKED(drawId));
    }, [dispatch]);

    const goToRewards = useCallback((drawId: string, title: string) => {
        dispatch(REWARDS_CLICKED(drawId, title));
    }, [dispatch]);

    const goToBetsList = useCallback((drawId: string, title: string) => {
        dispatch(BETS_LIST_CLICKED(drawId, title));
    }, [dispatch]);

    const goToCreateBet = useCallback((drawId: string, title: string) => {
        dispatch(CREATE_BET_CLICKED(drawId, title));
    }, [dispatch]);

    const goToError = useCallback(() => {
        dispatch(NAVIGATE_TO_ERROR());
    }, [dispatch]);

    const isClosingSoon = (bettingEndTime: string | null) => {
        if (!bettingEndTime) return false;
        const now = new Date();
        const endTime = new Date(bettingEndTime);
        const diffMs = endTime.getTime() - now.getTime();
        const diffMins = diffMs / (1000 * 60);
        return diffMins > 0 && diffMins <= 30;
    };

    const filteredDraws = useMemo(() => {
        const data = draws.data || [];
        if (statusFilter === 'all') return data;

        return data.filter(draw => {
            if (statusFilter === 'open') return draw.status === 'open';
            if (statusFilter === 'closed') return draw.status === 'closed';
            if (statusFilter === 'closing_soon') return isClosingSoon(draw.betting_end_time);
            return true;
        });
    }, [draws.data, statusFilter]);

    const dailyTotals = useMemo(() => {
        return (draws.data || []).reduce((acc, draw) => {
            return {
                totalCollected: acc.totalCollected + (draw.totalCollected || 0),
                premiumsPaid: acc.premiumsPaid + (draw.premiumsPaid || 0),
                netResult: acc.netResult + (draw.netResult || 0),
                estimatedCommission: acc.estimatedCommission + ((draw.totalCollected || 0) * 0.10)
            };
        }, { totalCollected: 0, premiumsPaid: 0, netResult: 0, estimatedCommission: 0 });
    }, [draws.data]);

    return {
        draws: { ...draws, data: filteredDraws },
        summary,
        dailyTotals,
        statusFilter,
        setStatusFilter,
        refresh,
        goToRules,
        goToRewards,
        goToBetsList,
        goToCreateBet,
        goToError
    };
};
