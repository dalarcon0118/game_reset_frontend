import { CoreModel } from '../model';
import { CoreMsg } from '../msg';
import { Return, ret, Cmd } from '@core/tea-utils';
import { CoreService } from '../service';
import { updateModel, calculateNetworkStatus } from './utils';
import { NETWORK_STATUS_CHANGED } from '@/config/signals';

export const ConnectivityHandler = {
  handlePhysicalChanged: (model: CoreModel, payload: boolean): Return<CoreModel, CoreMsg> => {
    const nextConnectivity = { ...model.connectivity, isPhysicalConnected: payload };
    const nextNetworkStatus = calculateNetworkStatus({ connectivity: nextConnectivity, isOffline: model.isOffline });

    const wasOffline = !model.networkConnected;

    const nextModel = updateModel(model, { connectivity: nextConnectivity, networkConnected: nextNetworkStatus });

    const commands: Cmd[] = [CoreService.syncNetworkStatus(nextNetworkStatus)];
    const isAuthenticated = model.sessionStatus === 'AUTHENTICATED';

    // Emitir señal de cambio de estado de red si hubo transición
    if (wasOffline !== nextNetworkStatus) {
      commands.push(Cmd.sendMsg(NETWORK_STATUS_CHANGED({ isOnline: nextNetworkStatus, wasOffline })));
    }

    if (wasOffline && nextNetworkStatus && isAuthenticated) {
      if (model.isSessionContextVerified) {
        commands.push(CoreService.syncPendingBetsTask());
      } else if (!model.isVerifyingSession) {
        commands.push(CoreService.verifySessionContextTask());
      }
    }

    return ret(
      nextModel,
      (wasOffline && nextNetworkStatus)
        ? Cmd.batch(commands)
        : (nextNetworkStatus !== model.networkConnected
          ? CoreService.syncNetworkStatus(nextNetworkStatus)
          : Cmd.none)
    );
  },

  handleServerChanged: (model: CoreModel, payload: boolean): Return<CoreModel, CoreMsg> => {
    const nextConnectivity = { ...model.connectivity, isServerReachable: payload, lastCheck: Date.now() };
    const nextNetworkStatus = calculateNetworkStatus({ connectivity: nextConnectivity, isOffline: model.isOffline });

    const wasOffline = !model.networkConnected;

    const nextModel = updateModel(model, { connectivity: nextConnectivity, networkConnected: nextNetworkStatus });

    const commands: Cmd[] = [CoreService.syncNetworkStatus(nextNetworkStatus)];
    const isAuthenticated = model.sessionStatus === 'AUTHENTICATED';

    // Emitir señal de cambio de estado de red si hubo transición
    if (wasOffline !== nextNetworkStatus) {
      commands.push(Cmd.sendMsg(NETWORK_STATUS_CHANGED({ isOnline: nextNetworkStatus, wasOffline })));
    }

    if (wasOffline && nextNetworkStatus && isAuthenticated) {
      if (model.isSessionContextVerified) {
        commands.push(CoreService.syncPendingBetsTask());
      } else if (!model.isVerifyingSession) {
        commands.push(CoreService.verifySessionContextTask());
      }
    }

    return ret(
      nextModel,
      (wasOffline && nextNetworkStatus)
        ? Cmd.batch(commands)
        : (nextNetworkStatus !== model.networkConnected
          ? CoreService.syncNetworkStatus(nextNetworkStatus)
          : Cmd.none)
    );
  },

  handleSetManualOffline: (model: CoreModel, payload: boolean): Return<CoreModel, CoreMsg> => {
    const nextNetworkStatus = calculateNetworkStatus({ connectivity: model.connectivity, isOffline: payload });
    const wasOffline = !model.networkConnected;

    const nextModel = updateModel(model, { isOffline: payload, networkConnected: nextNetworkStatus });

    const commands: Cmd[] = [CoreService.syncNetworkStatus(nextNetworkStatus)];
    const isAuthenticated = model.sessionStatus === 'AUTHENTICATED';

    // Emitir señal de cambio de estado de red si hubo transición
    if (wasOffline !== nextNetworkStatus) {
      commands.push(Cmd.sendMsg(NETWORK_STATUS_CHANGED({ isOnline: nextNetworkStatus, wasOffline })));
    }

    if (wasOffline && nextNetworkStatus && isAuthenticated) {
      if (model.isSessionContextVerified) {
        commands.push(CoreService.syncPendingBetsTask());
      } else if (!model.isVerifyingSession) {
        commands.push(CoreService.verifySessionContextTask());
      }
    }

    return ret(
      nextModel,
      (wasOffline && nextNetworkStatus)
        ? Cmd.batch(commands)
        : (nextNetworkStatus !== model.networkConnected
          ? CoreService.syncNetworkStatus(nextNetworkStatus)
          : Cmd.none)
    );
  }
};
