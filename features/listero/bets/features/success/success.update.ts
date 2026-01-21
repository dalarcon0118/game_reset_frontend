import { singleton, ret, Return } from '@/shared/core/return';
import { Cmd } from '@/shared/core/cmd';
import { Model as GlobalModel } from '../../core/model';
import { SuccessMsg, SuccessMsgType } from './success.types';
import { match } from 'ts-pattern';
import { SharingService } from '@/shared/services/Sharing';
import { RemoteDataHttp } from '@/shared/core/remote.data.http';
import { RemoteData } from '@/shared/core/remote.data';

export function updateSuccess(msg: SuccessMsg, model: GlobalModel): Return<GlobalModel, SuccessMsg> {
    console.log('[success.update] Received message:', msg.type);
    return match<SuccessMsg, Return<GlobalModel, SuccessMsg>>(msg)
        .with({ type: SuccessMsgType.SHARE_VOUCHER_REQUESTED }, ({ uri }) => {
            return ret(
                {
                    ...model,
                    successSession: {
                        ...model.successSession,
                        sharingStatus: RemoteData.loading()
                    }
                },
                RemoteDataHttp.fetch(
                    () => SharingService.shareImage(uri, {
                        dialogTitle: 'Compartir Voucher de Apuesta'
                    }),
                    (webData) => ({ type: SuccessMsgType.SHARE_VOUCHER_RESPONSE, webData })
                )
            );
        })
        .with({ type: SuccessMsgType.SHARE_VOUCHER_RESPONSE }, ({ webData }) => {
            const nextModel = {
                ...model,
                successSession: {
                    ...model.successSession,
                    sharingStatus: webData
                }
            };

            return match(webData)
                .with({ type: 'Success' }, () => {
                    console.log('[success.update] Sharing process completed successfully');
                    return singleton(nextModel);
                })
                .with({ type: 'Failure' }, ({ error }) => {
                    return ret(
                        nextModel,
                        Cmd.alert({
                            title: 'Error',
                            message: `No se pudo compartir el voucher: ${error}`
                        })
                    );
                })
                .otherwise(() => singleton(nextModel));
        })
        .with({ type: SuccessMsgType.GO_HOME_REQUESTED }, () => {
            return ret(
                {
                    ...model,
                    managementSession: {
                        ...model.managementSession,
                        saveSuccess: false
                    }
                },
                Cmd.navigate({ pathname: '/', method: 'replace' })
            );
        })
        .exhaustive();
}
