import { Model } from '../model';
import { Msg } from '../msg';
import { Cmd, ret, singleton, Return } from '@core/tea-utils';
import { StatusFilter } from '../core.types';
import { TimerRepository } from '@/shared/repositories/system/time/tea.repository';
import { drawRepository } from '@/shared/repositories/draw';

export const FilterHandler = {
  handleStatusFilterChanged: (model: Model, filter: StatusFilter): Return<Model, Msg> => {
    return ret(
      { ...model, statusFilter: filter },
      Cmd.sleep(500, { type: 'APPLY_STATUS_FILTER', filter })
    );
  },

  handleApplyStatusFilter: (model: Model, filter: StatusFilter): Return<Model, Msg> => {
    const drawsData = model.draws.type === 'Success' ? model.draws.data : [];
    const now = TimerRepository.getTrustedNow(Date.now());
    const filteredDraws = drawRepository.filterDraws(drawsData, filter, now);

    return singleton({
      ...model,
      appliedFilter: filter,
      filteredDraws,
    });
  }
};
