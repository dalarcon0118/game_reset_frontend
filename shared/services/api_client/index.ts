import { AuthRepository } from '../../repositories/auth';
import { TimerRepository } from '../../repositories/system/time/timer.repository';
import { ITimerRepository } from './api_client.types';
import { ApiClient } from './api_client';
import settings from '../../../config/settings';
import { logger } from '../../utils/logger';

export { ApiClient };
export * from './api_client.types';
export * from './api_client.errors';

const log = logger.withTag('API_CLIENT');

export const apiClient = new ApiClient(
    AuthRepository,
    TimerRepository as unknown as ITimerRepository,
    settings,
    log
);

export default apiClient;
