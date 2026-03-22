import { Cmd } from '../../core/tea-utils/cmd';
import { WebData } from '../../core/tea-utils/remote.data.http';
import { SlotMachine, SlotSpinResult, SpinRequest } from './types';

/**
 * Repositorio de Slots (TEA Compliant).
 * Proporciona generadores de comandos (Cmd) para que el 'Update' 
 * gestione las peticiones de forma declarativa.
 */
export const SlotRepository = {
    /**
     * Comando para obtener la lista de máquinas de slots activas.
     * @param onResult Mensaje a disparar con el resultado de la petición (WebData)
     */
    getMachines: <Msg>(onResult: (res: WebData<SlotMachine[]>) => Msg) =>
        Cmd.http<SlotMachine[]>(
            {
                method: 'GET',
                url: '/slots/machines/',
            },
            onResult
        ),

    /**
     * Comando para obtener el detalle de una máquina específica.
     * @param id ID de la máquina
     * @param onResult Mensaje a disparar con el resultado de la petición (WebData)
     */
    getMachineDetail: <Msg>(id: number, onResult: (res: WebData<SlotMachine>) => Msg) =>
        Cmd.http<SlotMachine>(
            {
                method: 'GET',
                url: `/slots/machines/${id}/`,
            },
            onResult
        ),

    /**
     * Comando para ejecutar un giro en una máquina.
     * @param req Datos del giro (machine_id, amount)
     * @param onResult Mensaje a disparar con el resultado de la petición (WebData)
     */
    spin: <Msg>(req: SpinRequest, onResult: (res: WebData<SlotSpinResult>) => Msg) =>
        Cmd.http<SlotSpinResult>(
            {
                method: 'POST',
                url: `/slots/machines/${req.machine_id}/spin/`,
                body: { amount: req.amount },
            },
            onResult
        ),
};
