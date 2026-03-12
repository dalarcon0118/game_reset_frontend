import { ret, singleton, Return, Cmd, RemoteData } from '@core/tea-utils';
import {
    VoucherModel,
    VoucherMsg,
    VoucherMsgType,
    VoucherData
} from '../domain/success.types';
import { VoucherAdapter } from '../../infrastructure/adapters/voucher.adapter';
import { SuccessImpl } from '../domain/success.impl';
import { LISTER_ROOT } from '@/config/routes/lister';
import { logger } from '@/shared/utils/logger';
import { match } from 'ts-pattern';

const log = logger.withTag('SUCCESS_FLOWS');

/**
 * 🌊 SUCCESS FEATURE FLOWS
 * 
 * Separation of concerns:
 * - User Flows: Handle UI intents (Navigation, requests).
 * - Business Flows: Orchestrate domain logic and side-effect results.
 */
export const SuccessFlows = {

    // --- 👤 User Flows (UI Intents) ---

    /**
     * User enters the success screen or triggers a refresh.
     */
    startLoadingVoucher: (model: VoucherModel, drawId?: string, receiptCode?: string): Return<VoucherModel, VoucherMsg> => {
        log.info('🚀 User Flow: Starting voucher load', { drawId, receiptCode });

        return ret(
            { ...model, voucherData: RemoteData.loading() },
            SuccessBusinessFlows.cmdLoadData(drawId, receiptCode)
        );
    },

    /**
     * User clicks on the share button.
     */
    requestShare: (model: VoucherModel, uri: string): Return<VoucherModel, VoucherMsg> => {
        log.info('📤 User Flow: Requesting share', { uri });

        return ret(
            { ...model, sharingStatus: RemoteData.loading() },
            SuccessBusinessFlows.cmdShare(uri)
        );
    },

    /**
     * User wants to return to the home screen.
     */
    handleNavigateHome: (model: VoucherModel): Return<VoucherModel, VoucherMsg> => {
        log.info('🏠 User Flow: Navigating home');
        return ret(model, Cmd.navigate(LISTER_ROOT));
    },


    // --- ⚙️ Business Flows (Orchestration & Results) ---

    /**
     * Handles the outcome of the data loading process.
     */
    processDataReceived: (model: VoucherModel, data: RemoteData<string, VoucherData>): Return<VoucherModel, VoucherMsg> => {
        log.info('⚙️ [Business Flow]: Processing received data', JSON.stringify(data));
        return singleton({ ...model, voucherData: data });
    },

    /**
     * Handles the outcome of the sharing process, including UI feedback for errors.
     */
    finalizeSharing: (model: VoucherModel, result: RemoteData<string, boolean>): Return<VoucherModel, VoucherMsg> => {
        log.info('⚙️ Business Flow: Finalizing sharing', { status: result.type });

        const nextModel = { ...model, sharingStatus: result };

        return match<RemoteData<string, boolean>, Return<VoucherModel, VoucherMsg>>(result)
            .with({ type: 'Failure' }, ({ error }) =>
                ret(nextModel, Cmd.alert({
                    title: 'Error de Compartido',
                    message: `No se pudo completar la acción: ${error}`
                }))
            )
            .otherwise(() => singleton(nextModel));
    }
};

/**
 * Internal Business Commands (Private to the feature orchestration)
 */
const SuccessBusinessFlows = {
    cmdLoadData: (drawId?: string, receiptCode?: string) =>
        Cmd.task({
            label: 'LOAD_VOUCHER_DATA',
            task: () => VoucherAdapter.fetchSourceData({ drawId, receiptCode }),
            onSuccess: (source) => ({
                type: VoucherMsgType.DATA_RECEIVED,
                data: RemoteData.success(SuccessImpl.toVoucherData(source, receiptCode))
            }),
            onFailure: (err) => ({
                type: VoucherMsgType.DATA_RECEIVED,
                data: RemoteData.failure(err.message || 'Error al cargar datos del recibo')
            })
        }),

    cmdShare: (uri: string) =>
        Cmd.task({
            label: 'SHARE_VOUCHER',
            task: () => VoucherAdapter.shareVoucher(uri),
            onSuccess: (res) => ({
                type: VoucherMsgType.SHARE_RESPONSE,
                webData: RemoteData.success(res)
            }),
            onFailure: (err) => ({
                type: VoucherMsgType.SHARE_RESPONSE,
                webData: RemoteData.failure(err.message || 'Error al intentar compartir el recibo')
            })
        })
};
