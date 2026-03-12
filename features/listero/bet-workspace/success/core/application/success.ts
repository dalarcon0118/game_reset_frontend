import { singleton, ret, Return, Cmd } from '@core/tea-utils';
import { VoucherMsg, VoucherMsgType, VoucherModel, initialVoucherModel } from '../domain/success.types';
import { SuccessFlows } from './success.flows';
import { match } from 'ts-pattern';

/**
 * Initial state for Voucher
 */
export const initVoucher = (): [VoucherModel, Cmd] => [initialVoucherModel, null];

/**
 * Pure Update function for Voucher
 * 
 * Acting as a thin Dispatcher that delegates to Flows.
 */
export function updateVoucher(model: VoucherModel, msg: VoucherMsg): Return<VoucherModel, VoucherMsg> {
    return match<VoucherMsg, Return<VoucherModel, VoucherMsg>>(msg)
        .with({ type: VoucherMsgType.LOAD_DATA_REQUESTED }, ({ drawId, receiptCode }) =>
            SuccessFlows.startLoadingVoucher(model, drawId, receiptCode)
        )
        .with({ type: VoucherMsgType.DATA_RECEIVED }, ({ data }) =>
            SuccessFlows.processDataReceived(model, data)
        )
        .with({ type: VoucherMsgType.SHARE_REQUESTED }, ({ uri }) =>
            SuccessFlows.requestShare(model, uri)
        )
        .with({ type: VoucherMsgType.SHARE_RESPONSE }, ({ webData }) =>
            SuccessFlows.finalizeSharing(model, webData)
        )
        .with({ type: VoucherMsgType.GO_HOME_REQUESTED }, () =>
            SuccessFlows.handleNavigateHome(model)
        )
        .exhaustive();
}
