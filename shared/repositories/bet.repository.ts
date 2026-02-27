import { betRepository } from './bet/bet.repository';
import { IBetRepository } from './bet/bet.types';

/**
 * Legacy export for BetRepository.
 * This file acts as a bridge to the new agnostic BetRepository implementation.
 * 
 * @deprecated Prefer importing betRepository from '@/shared/repositories/bet/bet.repository'
 */
export const BetRepository: IBetRepository = betRepository;
