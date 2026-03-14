import { createMsg } from '@/shared/core/tea-utils/msg';
import { TimeMetadata, TimeIntegrityResult } from './time.types';

export const Msg = {
    // Initialization
    init: createMsg('INIT'),

    // Server Sync
    serverDateReceived: createMsg<'SERVER_DATE_RECEIVED', {
        dateHeader: string | null;
        clientNow: number;
        systemNow: number;
    }>('SERVER_DATE_RECEIVED'),

    // Integrity Validation
    validateIntegrity: createMsg<'VALIDATE_INTEGRITY', {
        clientNow: number;
    }>('VALIDATE_INTEGRITY'),
    integrityValidated: createMsg<'INTEGRITY_VALIDATED', TimeIntegrityResult>('INTEGRITY_VALIDATED'),

    // Metadata Persistence
    metadataLoaded: createMsg<'METADATA_LOADED', TimeMetadata | null>('METADATA_LOADED'),
    metadataSaved: createMsg<'METADATA_SAVED', void>('METADATA_SAVED'),

    // Errors
    errorOccurred: createMsg<'ERROR_OCCURRED', string>('ERROR_OCCURRED'),
};

export type Msg =
    | ReturnType<typeof Msg.init>
    | ReturnType<typeof Msg.serverDateReceived>
    | ReturnType<typeof Msg.validateIntegrity>
    | ReturnType<typeof Msg.integrityValidated>
    | ReturnType<typeof Msg.metadataLoaded>
    | ReturnType<typeof Msg.metadataSaved>
    | ReturnType<typeof Msg.errorOccurred>;
