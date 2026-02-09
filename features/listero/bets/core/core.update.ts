import { singleton, ret, Return } from '@/shared/core/return';
import { Cmd } from '@/shared/core/cmd';
import { Model } from './model';
import { Msg, CoreMsg, CoreMsgType } from './msg';
import { match } from 'ts-pattern';
import { RemoteData } from '@/shared/core/remote.data';
import { RemoteDataHttp } from '@/shared/core/remote.data.http';
import { DrawService } from '@/shared/services/draw';
import { ListMsgType } from '../features/bet-list/list.types';

export function updateCore(model: Model, msg: CoreMsg): Return<Model, Msg> {
    return match<CoreMsg, Return<Model, Msg>>(msg)
        .with({ type: CoreMsgType.DRAW_INFO_REQUESTED }, ({ drawId }) => {
            return ret(
                model,
                RemoteDataHttp.fetch(
                    async () => {
                        const result = await DrawService.getOne(drawId);
                        if (!result) throw new Error('Error al obtener información del sorteo');
                        return result;
                    },
                    (webData) => ({
                        type: 'CORE',
                        payload: {
                            type: CoreMsgType.DRAW_INFO_RECEIVED,
                            webData
                        }
                    })
                )
            );
        })

        .with({ type: CoreMsgType.DRAW_INFO_RECEIVED }, ({ webData }) => {
            return singleton({
                ...model,
                drawTypeCode: RemoteData.map(data => data?.draw_type_details?.code || '', webData),
                managementSession: { ...model.managementSession, drawDetails: webData }
            });
        })

        .with({ type: CoreMsgType.SCREEN_FOCUSED }, (m) => {
            const { drawId, isEditing } = m;

            // Si ya tenemos el tipo de sorteo para este ID, no lo ponemos en Loading para evitar parpadeos/bloqueos
            const alreadyHasDrawInfo = model.drawTypeCode.type === 'Success' && model.currentDrawId === drawId;

            const nextModel: Model = {
                ...model,
                currentDrawId: drawId,
                isEditing,
                drawTypeCode: alreadyHasDrawInfo ? model.drawTypeCode : RemoteData.loading<any, string>()
            };

            return ret(
                nextModel,
                Cmd.batch([
                    Cmd.ofMsg({
                        type: 'CORE',
                        payload: { type: CoreMsgType.DRAW_INFO_REQUESTED, drawId }
                    }),
                    // Siempre cargar la lista del backend (listSession) independientemente de si estamos anotando
                    Cmd.ofMsg({
                        type: 'LIST',
                        payload: { type: ListMsgType.FETCH_BETS_REQUESTED, drawId }
                    })
                ])
            );
        })

        .with({ type: CoreMsgType.SET_NAVIGATION }, ({ navigation }) => {
            return singleton({ ...model, navigation });
        })

        .with({ type: CoreMsgType.CLEAR_NAVIGATION }, () => {
            return singleton({ ...model, navigation: null });
        })

        .with({ type: CoreMsgType.SET_IS_EDITING }, ({ isEditing }) => {
            return singleton({ ...model, isEditing });
        })
        .with({ type: CoreMsgType.NAVIGATE_TO_CREATE }, () => {
            if (!model.currentDrawId) return singleton(model);
            return ret(
                model,
                Cmd.navigate(`/lister/bets_create/${model.currentDrawId}`)
            );
        })
        .otherwise(() => singleton(model));
}
