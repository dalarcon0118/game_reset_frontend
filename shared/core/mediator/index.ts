/**
 * Mediator Module - TEA Store Communication with Resolver Pattern
 * 
 * Exports:
 * - createMediator: Factory for TeaMediator
 * - createMediatorRegistry: Global registry of mediators
 * - Types for TeaMediator, TeaResolver, etc.
 */

export * from './types';
export * from './factory';
export * from './global_resolver';

// Re-export commonly used types
export type { ElmStore, StoreState, StoreFactory } from '../tea/types';
export type { MsgWithReply } from '../tea/types';
