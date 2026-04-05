import { Task } from '../../core';
import { TimeAnchor } from './time-anchor.repository';

export interface IDeviceSecretRepository {
    saveDailySecret(secret: string): Task<Error, string>;
    getSecret(): Task<Error, string>;
}

export interface ITimeAnchorRepository {
    saveAnchor(data: { serverTime: number, signature: string, validUntil: number }): Task<Error, TimeAnchor>;
}
