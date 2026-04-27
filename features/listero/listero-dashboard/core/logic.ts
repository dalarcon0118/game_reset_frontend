import { logger } from '@/shared/utils/logger';
import { Model } from './model';
import { RemoteData } from '@core/tea-utils';
import { DashboardUser } from './user.dto';
import { WebData } from '@core/tea-utils';

const log = logger.withTag('DASHBOARD_LOGIC');

export const shouldFetchData = (model: Model, requestedId: string | null): boolean => {
  if (!requestedId || requestedId === '0') return false;

  if (model.draws.type === 'Success' && model.userStructureId === requestedId) {
    return false;
  }

  if (model.draws.type === 'Loading' && model.userStructureId === requestedId) {
    return false;
  }

  return true;
};

export const checkRateLimit = (webData: WebData<any>): boolean => {
  if (webData.type !== 'Failure' || !webData.error) return false;
  const error = webData.error;
  return error.status === 429 || error.message?.includes('throttled');
};

export const handleAuthUserSynced = (model: Model, user: DashboardUser | null): Model => {
  if (!user) {
    if (model.currentUser) {
      log.info('User logged out, clearing dashboard state');
      return {
        ...model,
        currentUser: null,
        userStructureId: null,
        draws: RemoteData.notAsked()
      };
    }
    return model;
  }

  const newStructureId = user.structureId;
  const newCommissionRate = user.commissionRate;

  const structureChanged = model.userStructureId !== newStructureId;
  const commissionChanged = model.commissionRate !== newCommissionRate;

  if (!structureChanged && !commissionChanged) {
    return model;
  }

  log.info('User structure/commission updated', {
    oldStruct: model.userStructureId,
    newStruct: newStructureId,
    structureChanged
  });

  return {
    ...model,
    currentUser: user,
    userStructureId: newStructureId,
    commissionRate: newCommissionRate,
    draws: structureChanged ? RemoteData.notAsked() : model.draws
  };
};

export const handleSseUpdate = (model: Model, update: any): { shouldFetch: boolean } => {
  if (update.type !== 'FINANCIAL_UPDATE' || !update.data) {
    return { shouldFetch: false };
  }

  const updateStructureId = update.structure_id ? String(update.structure_id) : null;

  if (updateStructureId && updateStructureId !== model.userStructureId) {
    return { shouldFetch: false };
  }

  return { shouldFetch: true };
};
