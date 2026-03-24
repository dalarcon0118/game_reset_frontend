import { CoreModel } from '../model';
import { CoreMsg } from '../msg';
import { Return, ret, Cmd } from '@core/tea-utils';
import { CoreService } from '../service';
import { updateModel } from './utils';

export const MaintenanceHandler = {
  handleCompleted: (model: CoreModel, payload: { date: string; status: 'ready' }): Return<CoreModel, CoreMsg> => {
    const nextModel = updateModel(model, { maintenanceStatus: payload });
    return ret(
      nextModel,
      nextModel.isSystemReady
        ? CoreService.notifySystemReady(payload.date, nextModel.userContext)
        : Cmd.none
    );
  }
};
