import { singleton, ret, Return } from '@/shared/core/return';
import { Cmd } from '@/shared/core/cmd';
import { Model as GlobalModel } from '../../core/model';
import { SuccessMsg, SuccessMsgType } from './success.types';
import { match } from 'ts-pattern';
import * as Sharing from 'expo-sharing';

export function updateSuccess(msg: SuccessMsg, model: GlobalModel): Return<GlobalModel, SuccessMsg> {
    console.log('[success.update] Received message:', msg.type);
    return match<SuccessMsg, Return<GlobalModel, SuccessMsg>>(msg)
        .with({ type: SuccessMsgType.SHARE_VOUCHER_REQUESTED }, ({ uri }) => {
            return ret(
                model,
                Cmd.task({
                    task: async (uri: string) => {
                        console.log('[success.update] Attempting to share URI:', uri);
                        const isAvailable = await Sharing.isAvailableAsync();

                        if (!isAvailable) {
                            console.error('[success.update] Sharing not available on this platform');
                            throw new Error('La funcionalidad de compartir no está disponible en este dispositivo');
                        }

                        // Aseguramos que el URI tenga el formato correcto para Android si es necesario
                        const shareUri = uri.startsWith('file://') ? uri : `file://${uri}`;

                        await Sharing.shareAsync(shareUri, {
                            mimeType: 'image/png',
                            dialogTitle: 'Compartir Voucher de Apuesta',
                            UTI: 'public.png'
                        });

                        return true;
                    },
                    args: [uri],
                    onSuccess: () => ({ type: SuccessMsgType.SHARE_VOUCHER_SUCCESS }),
                    onFailure: (e) => ({ type: SuccessMsgType.SHARE_VOUCHER_FAILED, error: e instanceof Error ? e.message : String(e) })
                })
            );
        })
        .with({ type: SuccessMsgType.SHARE_VOUCHER_SUCCESS }, () => {
            console.log('[success.update] Sharing process completed successfully');
            return singleton(model);
        })
        .with({ type: SuccessMsgType.SHARE_VOUCHER_FAILED }, ({ error }) => {
            return ret(
                model,
                Cmd.alert({
                    title: 'Error',
                    message: `No se pudo compartir el voucher: ${error}`
                })
            );
        })
        .with({ type: SuccessMsgType.GO_HOME_REQUESTED }, () => {
            return ret(
                model,
                Cmd.navigate({ pathname: '/', method: 'replace' })
            );
        })
        .exhaustive();
}
