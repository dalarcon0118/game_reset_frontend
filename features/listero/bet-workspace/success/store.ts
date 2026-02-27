import { createElmStore } from '@/shared/core/engine';
import { VoucherModel, VoucherMsg, initialVoucherModel } from './core/domain/success.types';
import { updateVoucher } from './core/application/success';
import { effectHandlers as coreEffectHandlers } from '@/shared/core/effect_handlers';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('VOUCHER_STORE');

/**
 * Voucher Store Factory
 */
export const makeVoucherStore = () => createElmStore<VoucherModel, VoucherMsg>(
    initialVoucherModel,
    (model, msg) => {
        const result = updateVoucher(model, msg);
        return [result.model, result.cmd];
    },
    coreEffectHandlers as any // Using standard engine effects only
);
