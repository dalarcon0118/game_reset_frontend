import { useEffect, useCallback } from 'react';
import { useAuth } from '../../../auth';
import {
    useDashboardStore,
    selectDraws,
    selectSummary,
    selectDispatch,
    selectStatusFilter,
    selectDailyTotals
} from '../store';
import {
    FETCH_DATA_REQUESTED,
    REFRESH_CLICKED,
    SET_USER_STRUCTURE,
    RULES_CLICKED,
    REWARDS_CLICKED,
    BETS_LIST_CLICKED,
    CREATE_BET_CLICKED,
    NAVIGATE_TO_ERROR,
    STATUS_FILTER_CHANGED,
    StatusFilter
} from '../store/types';

export const useDashboard = () => {
    const { user } = useAuth();
    const draws = useDashboardStore(selectDraws);
    const summary = useDashboardStore(selectSummary);
    const dispatch = useDashboardStore(selectDispatch);
    const statusFilter = useDashboardStore(selectStatusFilter);
    const dailyTotals = useDashboardStore(selectDailyTotals);
    const commissionRate = useDashboardStore(state => state.model.commissionRate);

    const setStatusFilter = useCallback((filter: StatusFilter) => {
        dispatch(STATUS_FILTER_CHANGED(filter));
    }, [dispatch]);

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

    return {
        draws: { ...draws, data: draws.filteredData },
        summary,
        dailyTotals,
        statusFilter,
        commissionRate,
        setStatusFilter,
        refresh,
        goToRules,
        goToRewards,
        goToBetsList,
        goToCreateBet,
        goToError
    };
};
