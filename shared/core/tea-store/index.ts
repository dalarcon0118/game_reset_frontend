/**
 * TEAStore - A generic CRUD component built on TEA architecture
 * 
 * This module provides a reusable, type-safe store for managing entities
 * with full CRUD operations, built on the existing TEA architecture patterns.
 * 
 * @example
 * import { useTEAStore, Entity, TEAStoreConfig } from '@core/tea-store';
 * 
 * interface User extends Entity {
 *     id: string;
 *     name: string;
 *     email: string;
 * }
 * 
 * const userConfig: TEAStoreConfig<User> = {
 *     fetchAll: userService.fetchAll,
 *     fetchOne: userService.fetchOne,
 *     create: userService.create,
 *     update: userService.update,
 *     delete: userService.delete,
 * };
 * 
 * function UserManagementScreen() {
 *     const { model, actions } = useTEAStore(userConfig);
 *     // ... component implementation
 * }
 */

// Types
export type { Entity } from './tea-store.types';
export type { TEAStoreConfig } from './tea-store.types';
export type { TEAStoreState } from './tea-store.types';
export type { TEAStoreMsg } from './tea-store.types';
export { TEAStoreMsgType } from './tea-store.types';

// Update function factory
export { createTEAStoreUpdate } from './tea-store.update';

// React hook
export { useTEAStore } from './tea-store.hook';
