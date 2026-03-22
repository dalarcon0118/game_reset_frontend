import { ISlotsRepository } from '../slots.ports';
import { SlotMachine, SlotSpinResult, SpinRequest } from '../types';

/**
 * Adaptador de API para el repositorio de Slots.
 * Este adaptador se comunica con el backend de Django.
 */
export class SlotsApiAdapter implements ISlotsRepository {
    private readonly baseUrl = '/slots/machines';

    constructor(private readonly api: any) {} // Inyectamos el servicio de API global

    async getMachines(): Promise<SlotMachine[]> {
        const response = await this.api.get(`${this.baseUrl}/`);
        return response.data;
    }

    async getMachineDetail(id: number): Promise<SlotMachine> {
        const response = await this.api.get(`${this.baseUrl}/${id}/`);
        return response.data;
    }

    async spin(req: SpinRequest): Promise<SlotSpinResult> {
        const response = await this.api.post(`${this.baseUrl}/${req.machine_id}/spin/`, {
            amount: req.amount
        });
        return response.data;
    }
}
