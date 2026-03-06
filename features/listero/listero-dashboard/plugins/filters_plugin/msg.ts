import { createMsg } from '@/shared/core/tea-utils';
import { PluginContext } from '@/shared/core/plugins/plugin.types';

import { FiltersPluginConfig } from './model';

export const INIT_CONTEXT = createMsg<'INIT_CONTEXT', { context: PluginContext; config: FiltersPluginConfig }>('INIT_CONTEXT');
export const SELECT_FILTER = createMsg<'SELECT_FILTER', string>('SELECT_FILTER');
export const SYNC_STATUS_FILTER = createMsg<'SYNC_STATUS_FILTER', string>('SYNC_STATUS_FILTER');
export const NOOP = createMsg<'NOOP', void>('NOOP');

export type Msg =
  | typeof INIT_CONTEXT._type
  | typeof SELECT_FILTER._type
  | typeof SYNC_STATUS_FILTER._type
  | typeof NOOP._type;
