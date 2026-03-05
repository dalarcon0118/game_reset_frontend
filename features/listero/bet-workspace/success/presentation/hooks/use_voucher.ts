import { useCallback, useEffect, useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import ViewShot from 'react-native-view-shot';
import { VoucherMsgType } from '../../core/domain/success.types';
import { makeVoucherStore } from '../../store';
import { RemoteData } from '@/shared/core/remote.data';
import logger from '@/shared/utils/logger';

const log = logger.withTag('useVoucher');

/**
 * Custom hook for the Success View
 * Bridge between UI and the TEA Engine.
 * Follows SRP: only handles dispatching and selecting data.
 * This hook is agnostic and depends only on router params.
 */
export const useVoucher = () => {
    // Create a fresh store instance once per component lifecycle
    const useLocalStore = useMemo(() => makeVoucherStore(), []);
    const { model, dispatch, init, cleanup } = useLocalStore();

    // @ts-ignore - params might not be typed correctly in some environments
    const { receiptCode: paramReceiptCode, drawId: paramDrawId } = useLocalSearchParams<{ receiptCode: string, drawId: string }>();

    // DEBUG: Log route params
    log.info('📍 Route params received', { paramReceiptCode, paramDrawId });

    // Orchestrate store lifecycle: init on mount, cleanup on unmount
    useEffect(() => {
        log.debug('🏁 Store init called');
        init();
        return () => cleanup();
    }, [init, cleanup]);

    // Single responsibility: Trigger initial load based on available router params
    useEffect(() => {
        const drawId = paramDrawId;
        const receiptCode = paramReceiptCode;

        log.info('🎯 Triggering load', { drawId, receiptCode, hasDrawId: !!drawId, hasReceiptCode: !!receiptCode });

        if (drawId || receiptCode) {
            log.debug('📤 Dispatching LOAD_DATA_REQUESTED', { drawId, receiptCode });
            dispatch({
                type: VoucherMsgType.LOAD_DATA_REQUESTED,
                drawId,
                receiptCode
            });
        } else {
            log.warn('⚠️ No drawId or receiptCode provided - will show error state', { drawId, receiptCode });
        }
    }, [paramReceiptCode, paramDrawId, dispatch]);

    // UI Actions translated to domain messages
    const handleShare = useCallback(async (ref: React.RefObject<ViewShot>) => {
        if (!ref.current?.capture) return;
        try {
            const uri = await ref.current.capture();
            dispatch({ type: VoucherMsgType.SHARE_REQUESTED, uri });
        } catch (err) {
            // Error becomes part of the state, handled by the store (e.g., showing an alert)
            dispatch({
                type: VoucherMsgType.SHARE_RESPONSE,
                webData: RemoteData.failure('Error al capturar comprobante para compartir')
            });
        }
    }, [dispatch]);

    const handleBack = useCallback(() => {
        dispatch({ type: VoucherMsgType.GO_HOME_REQUESTED });
    }, [dispatch]);

    useEffect(() => {
        log.info('📝 Voucher data updated', { voucherData: model.voucherData });
    }, []);

    return {
        // Expose data mapped from model
        data: model.voucherData.type === 'Success' ? model.voucherData.data : null,
        sharingStatus: model.sharingStatus,
        handleShare,
        handleBack,
        isLoading: model.voucherData.type === 'Loading'
    };
};
