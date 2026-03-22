import { Model } from '../model';
import { Msg } from '../msg';
import { Cmd, ret, singleton, Return } from '@core/tea-utils';
import { recalculateDashboardState } from '../logic';
import { StatusFilter } from '../core.types';
import { TimerRepository } from '@/shared/repositories/system/time/tea.repository';

export const FilterHandler = {
    handleStatusFilterChanged: (model: Model, filter: StatusFilter): Return<Model, Msg> => {
        return ret(
            { ...model, statusFilter: filter },
            Cmd.sleep(500, { type: 'APPLY_STATUS_FILTER', filter })
        );
    },

    handleApplyStatusFilter: (model: Model, filter: StatusFilter): Return<Model, Msg> => {
        const drawsData = model.draws.type === 'Success' ? model.draws.data : null;
        const now = TimerRepository.getTrustedNow(Date.now());

        const { filteredDraws, dailyTotals } = recalculateDashboardState(
            drawsData,
            null, // El sumario ya no se usa directamente aquí o se integra de otra forma
            filter,
            model.commissionRate,
            now,
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
        const now = TimerRepository.getTrustedNow(Date.now());

        const { filteredDraws, dailyTotals } = recalculateDashboardState(
            drawsData,
            null,
            model.appliedFilter,
            commissionRate,
            now,
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
