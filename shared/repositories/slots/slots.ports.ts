import { SlotMachine, SlotSpinResult, SpinRequest } from './types';

export interface ISlotsRepository {
    /**
     * Obtiene la lista de máquinas de slots activas.
     */
    getMachines(): Promise<SlotMachine[]>;

    /**
     * Obtiene el detalle de una máquina específica.
     */
    getMachineDetail(id: number): Promise<SlotMachine>;

    /**
     * Ejecuta un giro en una máquina.
     */
    spin(req: SpinRequest): Promise<SlotSpinResult>;
}
