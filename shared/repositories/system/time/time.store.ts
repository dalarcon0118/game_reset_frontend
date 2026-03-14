import { createElmStore } from '@/shared/core/tea';
import { TimeModel } from './time.types';
import { Msg } from './time.msg';
import { init, update } from './time.update';

/**
 * Factory for TimeStore - TEA implementation for Trusted Time Integrity.
 */
export const createTimeStore = () => createElmStore<TimeModel, Msg>({
    id: 'system/time',
    name: 'TimeStore',
    initial: init,
    update: (model, msg) => update(msg, model),
});

/**
 * Type definition for the TimeStore
 */
export type TimeStore = ReturnType<typeof createTimeStore>;

/**
 * Selectors
 */
export const selectTimeMetadata = (state: { model: TimeModel }) => state.model.metadata;
export const selectTimeStatus = (state: { model: TimeModel }) => state.model.status;
