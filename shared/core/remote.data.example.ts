import { Return } from './return';
import { Cmd } from './cmd';
import { RemoteData, WebData } from './remote.data';

// --- Model ---
// Imaginemos que cargamos una lista de vehículos.
interface Vehicle { id: string; name: string }

interface Model {
    vehicles: WebData<Vehicle[]>;
}

const initialModel: Model = {
    vehicles: RemoteData.notAsked()
};

// --- Mensajes ---
type Msg
    = { type: 'FetchVehicles' }
    | { type: 'VehiclesLoaded', payload: Vehicle[] }
    | { type: 'VehiclesFailed', payload: string };

// --- Update ---
export function update(msg: Msg, model: Model): Return<Model, Msg> {
    switch (msg.type) {
        case 'FetchVehicles':
            // 1. Cambiamos estado a Loading
            // 2. Lanzamos el comando HTTP (simulado aquí)
            return Return.val(
                { ...model, vehicles: RemoteData.loading() },
                // Simulación de comando HTTP
                Cmd.http({
                    url: '/api/vehicles',
                    method: 'GET'
                }, (response: any) => {
                    // Mapeo de respuesta a nuestros mensajes
                    if (response.error) {
                        return { type: 'VehiclesFailed', payload: response.error };
                    }
                    return { type: 'VehiclesLoaded', payload: response.data };
                })
            );

        case 'VehiclesLoaded':
            return Return.singleton({
                ...model,
                vehicles: RemoteData.success(msg.payload)
            });

        case 'VehiclesFailed':
            return Return.singleton({
                ...model,
                vehicles: RemoteData.failure(msg.payload)
            });
    }
}

// --- View / Rendering Example ---
// Ejemplo de cómo consumir el estado en la UI
export function view(model: Model) {
    return RemoteData.fold({
        notAsked: () => 'Haga click para cargar',
        loading: () => 'Cargando vehículos...',
        failure: (err: string) => `Error al cargar: ${err}`,
        success: (data: Vehicle[]) => `Vehículos cargados: ${data.length}`
    }, model.vehicles);
}
