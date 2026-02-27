import { Model } from '../model';
import { Msg } from '../msg';
import { Cmd } from '@/shared/core/cmd';
import { ret, singleton, Return } from '@/shared/core/return';
import { recalculateDashboardState } from '../logic';
import { StatusFilter } from '../core.types';

export const FilterHandler = {
    handleStatusFilterChanged: (model: Model, filter: StatusFilter): Return<Model, Msg> => {
        return ret(
            { ...model, statusFilter: filter },
            Cmd.sleep(500, { type: 'APPLY_STATUS_FILTER', filter })
        );
    },

    handleApplyStatusFilter: (model: Model, filter: StatusFilter): Return<Model, Msg> => {
        const drawsData = model.draws.type === 'Success' ? model.draws.data : null;
        const summaryData = model.summary.type === 'Success' ? model.summary.data : null;

        const { filteredDraws, dailyTotals } = recalculateDashboardState(
            drawsData,
            summaryData,
            filter,
            model.commissionRate,
            model.pendingBets
        );

        return singleton({
            ...model,
            appliedFilter: filter,
            filteredDraws,
            dailyTotals
        });
    },

    handleSetCommissionRate: (model: Model, rate: number): Return<Model, Msg> => {
        const commissionRate = rate / 100;
        const drawsData = model.draws.type === 'Success' ? model.draws.data : null;
        const summaryData = model.summary.type === 'Success' ? model.summary.data : null;

        const { filteredDraws, dailyTotals } = recalculateDashboardState(
            drawsData,
            summaryData,
            model.appliedFilter,
            commissionRate,
            model.pendingBets
        );

        return singleton({
            ...model,
            commissionRate,
            filteredDraws,
            dailyTotals
        });
    }
};
