import { CoreModel } from '../model';
import { CoreMsg } from '../msg';
import { Return, ret, Cmd } from '@core/tea-utils';
import { CoreService } from '../service';
import { updateModel, calculateNetworkStatus } from './utils';

export const ConnectivityHandler = {
  handlePhysicalChanged: (model: CoreModel, payload: boolean): Return<CoreModel, CoreMsg> => {
    const nextConnectivity = { ...model.connectivity, isPhysicalConnected: payload };
    const nextNetworkStatus = calculateNetworkStatus({ connectivity: nextConnectivity, isOffline: model.isOffline });

    const wasOffline = !model.networkConnected;
    const isNowOnline = nextNetworkStatus;

    const nextModel = updateModel(model, { connectivity: nextConnectivity, networkConnected: nextNetworkStatus });

    return ret(
      nextModel,
      (wasOffline && isNowOnline)
        ? Cmd.batch([
          CoreService.syncNetworkStatus(nextNetworkStatus),
          CoreService.syncPendingBetsTask()
        ])
        : (nextNetworkStatus !== model.networkConnected
          ? CoreService.syncNetworkStatus(nextNetworkStatus)
          : Cmd.none)
    );
  },

  handleServerChanged: (model: CoreModel, payload: boolean): Return<CoreModel, CoreMsg> => {
    const nextConnectivity = { ...model.connectivity, isServerReachable: payload, lastCheck: Date.now() };
    const nextNetworkStatus = calculateNetworkStatus({ connectivity: nextConnectivity, isOffline: model.isOffline });

    const wasOffline = !model.networkConnected;
    const isNowOnline = nextNetworkStatus;

    const nextModel = updateModel(model, { connectivity: nextConnectivity, networkConnected: nextNetworkStatus });

    return ret(
      nextModel,
      (wasOffline && isNowOnline)
        ? Cmd.batch([
          CoreService.syncNetworkStatus(nextNetworkStatus),
          CoreService.syncPendingBetsTask()
        ])
        : (nextNetworkStatus !== model.networkConnected
          ? CoreService.syncNetworkStatus(nextNetworkStatus)
          : Cmd.none)
    );
  },

  handleSetManualOffline: (model: CoreModel, payload: boolean): Return<CoreModel, CoreMsg> => {
    const nextNetworkStatus = calculateNetworkStatus({ connectivity: model.connectivity, isOffline: payload });
    const wasOffline = !model.networkConnected;
    const isNowOnline = nextNetworkStatus;

    const nextModel = updateModel(model, { isOffline: payload, networkConnected: nextNetworkStatus });

    return ret(
      nextModel,
      (wasOffline && isNowOnline)
        ? Cmd.batch([
          CoreService.syncNetworkStatus(nextNetworkStatus),
          CoreService.syncPendingBetsTask()
        ])
        : (nextNetworkStatus !== model.networkConnected
          ? CoreService.syncNetworkStatus(nextNetworkStatus)
          : Cmd.none)
    );
  }
};
