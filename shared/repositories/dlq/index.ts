export * from './dlq.types';
export * from './dlq.ports';
export * from './dlq.repository';
export * from './adapters/dlq.storage.adapter';
export * from './adapters/dlq.api.adapter';

import { DlqRepository } from './dlq.repository';
import { DlqStorageAdapter } from './adapters/dlq.storage.adapter';
import { DlqApiAdapter } from './adapters/dlq.api.adapter';

export const dlqRepository = new DlqRepository(
    new DlqStorageAdapter(),
    new DlqApiAdapter()
);
