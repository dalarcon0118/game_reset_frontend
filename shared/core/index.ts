export * from './tea-utils/events';
export * from './tea-utils/msg';
export * from './tea-utils/cmd';
export * from './tea-utils/sub';
export * from './tea-utils/remote.data';
export * from './tea-utils/return';
export * from './tea-utils/effect_registry';
export * from './engine/engine';
export * from './tea-utils/effect_handlers';

// Algebraic types
export { Maybe, Either, Result, ok, err, TEAAlgebraicUtils } from './algebraic-types';

// Task monad (pure + orchestration + DI + TEA)
export { Task } from './task';
export { TaskRuntime } from './task-runtime';
export { ReaderTask } from './reader-task';
export { TaskTEA } from './task-tea';

// TEAStore exports (avoiding duplicate exports from dependencies)
export type { Entity } from './tea-store/tea-store.types';
export type { TEAStoreConfig } from './tea-store/tea-store.types';
export type { TEAStoreState } from './tea-store/tea-store.types';
export type { TEAStoreMsg } from './tea-store/tea-store.types';
export { TEAStoreMsgType } from './tea-store/tea-store.types';
export { createTEAStoreUpdate } from './tea-store/tea-store.update';
export { useTEAStore } from './tea-store/tea-store.hook';
