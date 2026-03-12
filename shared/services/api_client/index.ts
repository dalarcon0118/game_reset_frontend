import { TimerRepository } from '../../repositories/system/time/timer.repository';
import { ITimerRepository, IAuthRepository } from './api_client.types';
import { ApiClient } from './api_client';
import settings from '../../../config/settings';
import { logger } from '../../utils/logger';

export { ApiClient };
export * from './api_client.types';
export * from './api_client.errors';

const log = logger.withTag('API_CLIENT');

let _authRepo: IAuthRepository | null = null;

export const setAuthRepository = (repo: IAuthRepository) => {
    _authRepo = repo;
};

export const apiClient = new ApiClient(
    () => {
        if (!_authRepo) {
            log.warn('AuthRepository accessed before initialization');
            throw new Error('AuthRepository not initialized');
        }
        return _authRepo;
    },
    TimerRepository as unknown as ITimerRepository,
    settings,
    log
);

export default apiClient;
