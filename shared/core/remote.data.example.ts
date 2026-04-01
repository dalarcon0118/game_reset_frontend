import { Return } from './return';
import { Cmd } from './tea-utils/cmd';
import { RemoteData, WebData } from './tea-utils/remote.data';

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




/// algo asi 

/* 

export const Ports = {
    // Salida: TEA → Repository (resuelven Promises)
    betPlaced: 'port/betPlaced',
    batchPlaced: 'port/batchPlaced',
    betsLoaded: 'port/betsLoaded',
    syncCompleted: 'port/syncCompleted',
    cleanupCompleted: 'port/cleanupCompleted',
    // ...
} as const;
 //En update.ts - Enviar por puerto

.with(Msg.syncCompleted.type(), ({ payload }) =>
    ret(
        { ...model, syncStatus: 'IDLE' as const },
        Cmd.sendPort({type: Ports.betPlaced}, payload)  // ← Sale por puerto
    )
)

// se crea el adapter para el respositorio 
/ port.system.ts - Abstracción formal
class PortSystem {
    private pending = new Map<string, { resolve: (v: any) => void; reject: (e: any) => void }>();

    // Crear puerto (Promise)
    create<T>(id: string): Promise<T> {
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
        });
    }

    // Resolver puerto cuando llega resultado
    resolve<T>(id: string, value: T): void {
        this.pending.get(id)?.resolve(value);
        this.pending.delete(id);
    }

    // Rechazar puerto cuando hay error
    reject(id: string, error: unknown): void {
        this.pending.get(id)?.reject(error);
        this.pending.delete(id);
    }
}
...  // API pública - crea puerto y dispara efecto
    async placeBet(betData: BetPlacementInput): Promise<Result<Error, BetRepositoryResult>> {
        const port = this.ports.create<Result<Error, BetRepositoryResult>>('placeBet');
        this.store.getState().dispatch(Msg.placeBetRequested({ data: betData }));
        return port;  // ← Port se resuelve cuando llega el resultado
    }
//

// en el engine se define un subcriptor
 Sub.subscribe({type: Ports.betPlaced}, (msg) => {
    port.resolve('placeBet', msg.payload);
 })
*/
