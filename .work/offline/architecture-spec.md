# Especificación de Arquitectura: Sistema Offline-First con TEA y Plugins

## 1. VISIÓN GENERAL DE LA ARQUITECTURA

### 1.1 Diagrama de Arquitectura Integrada

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CAPA DE HOST (Core)                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  Host Store (Zustand)                                                   │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │ │
│  │  │   draws     │  │   filters   │  │   summary   │  │ offlineState    │ │ │
│  │  │  (RemoteData)│  │  (Filters)  │  │  (Summary)  │  │ (OfflineState)  │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  Plugin Manager (Slot.tsx)                                              │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │ │
│  │  │  Slot "draws"   │  │ Slot "filters"  │  │   Slot "sync-status"    │  │ │
│  │  │  DrawsListPlugin│  │ FiltersPlugin   │  │   OfflineSyncPlugin     │  │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CAPA DE PLUGINS (TEA)                              │
│                                                                              │
│  ┌─────────────────────────┐    ┌─────────────────────────────────────────┐  │
│  │   DrawsListPlugin       │    │   OfflineSyncPlugin (Nuevo)             │  │
│  │  ┌───────────────────┐  │    │  ┌─────────────────────────────────────┐│  │
│  │  │ Model             │  │    │  │ Model                               ││  │
│  │  │ - draws           │  │    │  │ - pendingBets: PendingBet[]         ││  │
│  │  │ - filteredDraws   │  │    │  │ - drawStates: DrawFinancialState[]  ││  │
│  │  │ - context         │  │    │  │ - syncQueue: SyncQueueItem[]        ││  │
│  │  └───────────────────┘  │    │  │ - workerStatus: WorkerStatus        ││  │
│  │  ┌───────────────────┐  │    │  └─────────────────────────────────────┘│  │
│  │  │ Update            │  │    │  │ Update                              ││  │
│  │  │ - INIT            │  │    │  │ - INIT_WORKER                       ││  │
│  │  │ - DRAWS_LOADED    │  │    │  │ - BET_PLACED_LOCAL                  ││  │
│  │  │ - FILTER_CHANGED  │  │    │  │ - SYNC_STARTED                      ││  │
│  │  └───────────────────┘  │    │  │ - SYNC_COMPLETED                    ││  │
│  │  ┌───────────────────┐  │    │  │ - SYNC_ERROR                        ││  │
│  │  │ View              │  │    │  │ - FINANCIAL_STATE_UPDATED           ││  │
│  │  │ - Renderiza lista │  │    │  └─────────────────────────────────────┘│  │
│  │  │ - Usa combined    │──┼────┼─▶│ Subscriptions                       ││  │
│  │  │   financial state │  │    │  │ - Conectividad (online/offline)     ││  │
│  │  └───────────────────┘  │    │  │ - Intervalos de sync                ││  │
│  └─────────────────────────┘    │  └─────────────────────────────────────┘│  │
│                                 └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CAPA DE SERVICIOS                                   │
│                                                                              │
│  ┌─────────────────────────────┐  ┌────────────────────────────────────────┐ │
│  │   OfflineFinancialService   │  │   Async Sync Worker                    │ │
│  │  ┌─────────────────────────┐│  │  ┌────────────────────────────────────┐│ │
│  │  │ placeBet(betData)       ││  │  │ - Corre en segundo plano           ││ │
│  │  │ getDrawState(drawId)    ││  │  │ - Intervalo: 5s (configurable)     ││ │
│  │  │ syncNow()               ││  │  │ - Maneja cola de sincronización    ││ │
│  │  │ hasPendingChanges()     ││  │  │ - Backoff exponencial              ││ │
│  │  │ onStateChange(drawId)   ││  │  │ - Emite eventos al Host Store      ││ │
│  │  └─────────────────────────┘│  │  └────────────────────────────────────┘│ │
│  └─────────────────────────────┘  └────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────┐  ┌────────────────────────────────────────┐ │
│  │   LocalStorage Database     │  │   Bet API Client                       │ │
│  │  ┌─────────────────────────┐│  │  ┌────────────────────────────────────┐│ │
│  │  │ @pending_bets           ││  │  │ - POST /api/bets/                  ││ │
│  │  │ @draw_financial_states  ││  │  │ - Header: X-Idempotency-Key        ││ │
│  │  │ @sync_queue             ││  │  │ - Manejo de conflictos             ││ │
│  │  │ @sync_metadata          ││  │  └────────────────────────────────────┘│ │
│  │  └─────────────────────────┘│  └────────────────────────────────────────┘ │
│  └─────────────────────────────┘                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Principios de Diseño

1. **Separación de Responsabilidades**: Cada capa tiene una responsabilidad única y bien definida
2. **Unidirectional Data Flow**: Los datos fluyen en una sola dirección (Host → Plugins → Servicios)
3. **Plugin Agnostic**: Los plugins no conocen la implementación del sistema offline
4. **Event-Driven**: Comunicación entre capas mediante eventos/mensajes TEA
5. **Graceful Degradation**: El sistema funciona sin conexión con funcionalidad reducida

---

## 2. INTEGRACIÓN CON TEA (The Elm Architecture)

### 2.1 Modelo de Estado Global

```typescript
// Host Store - Estado compartido
interface HostState {
  // Estados existentes
  draws: RemoteData<Draw[]>;
  filters: FilterState;
  summary: SummaryState;
  
  // Nuevo: Estado Offline (inyectado por plugin)
  offline: OfflinePluginState;
}

// Estado del Plugin Offline (gestionado por OfflineSyncPlugin)
interface OfflinePluginState {
  pendingBets: PendingBet[];
  drawFinancialStates: Record<string, DrawFinancialState>;
  syncQueue: SyncQueueItem[];
  workerStatus: 'idle' | 'syncing' | 'error';
  lastSyncAttempt: number | null;
  isOnline: boolean;
}
```

### 2.2 Mensajes TEA para Offline

```typescript
// Mensajes del Host
type HostMsg =
  | { type: 'OFFLINE_STATE_CHANGED'; payload: OfflinePluginState }
  | { type: 'FINANCIAL_STATE_UPDATED'; drawId: string; state: DrawFinancialState }
  | { type: 'SYNC_STATUS_CHANGED'; status: WorkerStatus };

// Mensajes del Plugin Offline
type OfflinePluginMsg =
  | { type: 'INIT_WORKER' }
  | { type: 'BET_PLACED_LOCAL'; bet: PendingBet }
  | { type: 'SYNC_STARTED'; items: SyncQueueItem[] }
  | { type: 'SYNC_COMPLETED'; itemId: string; backendId: string }
  | { type: 'SYNC_ERROR'; itemId: string; error: string }
  | { type: 'ONLINE_STATUS_CHANGED'; isOnline: boolean }
  | { type: 'FINANCIAL_STATE_RECALCULATED'; drawId: string; state: DrawFinancialState };

// Mensajes entre Plugins
type InterPluginMsg =
  | { type: 'REQUEST_FINANCIAL_STATE'; drawId: string }
  | { type: 'FINANCIAL_STATE_RESPONSE'; drawId: string; state: DrawFinancialState };
```

### 2.3 Flujo de Datos TEA

```
1. Usuario crea apuesta
   └── BetForm Component
       └── dispatch({ type: 'PLACE_BET', betData })
           └── Host Store
               └── OfflinePlugin.update({ type: 'BET_PLACED_LOCAL' })
                   ├── Model: Agrega PendingBet
                   ├── Effect: Guarda en LocalStorage
                   ├── Effect: Actualiza DrawFinancialState
                   └── Msg: Emite 'FINANCIAL_STATE_UPDATED'

2. Plugin DrawsList recibe actualización
   └── Host Store cambia
       └── DrawsListPlugin.subscriptions detecta cambio
           └── Update: Recibe { type: 'FINANCIAL_STATE_UPDATED' }
               └── View: Re-render con nuevo estado combinado

3. Async Worker sincroniza
   └── Intervalo de 5s
       └── SyncWorker.processQueue()
           ├── Si éxito: dispatch({ type: 'SYNC_COMPLETED' })
           └── Si error: dispatch({ type: 'SYNC_ERROR' })
```

---

## 3. INTEGRACIÓN CON SISTEMA DE PLUGINS

### 3.1 Contrato de Plugin Offline

```typescript
// Configuración del plugin
interface OfflinePluginConfig {
  slot: 'sync-status';        // Slot donde se renderiza
  hostStateKey: 'offline';    // Key en el host store
  events: {
    financialStateUpdated: 'offline:financial_state_updated';
    syncStatusChanged: 'offline:sync_status_changed';
  };
}

// Props que recibe del Host
interface OfflinePluginProps {
  context: HostContext;       // Contexto compartido (user, structure, etc.)
  hostStore: HostState;       // Estado completo del host
  dispatch: HostDispatch;     // Función para emitir eventos al host
}

// Eventos que publica el Plugin
interface OfflinePluginEvents {
  'offline:financial_state_updated': { drawId: string; state: DrawFinancialState };
  'offline:sync_status_changed': { status: WorkerStatus; pendingCount: number };
  'offline:sync_error': { error: string; retryable: boolean };
}
```

### 3.2 Registro del Plugin en Host

```typescript
// features/listero/dashboard/dashboard.tsx
const plugins = [
  {
    slot: 'draws',
    component: DrawsListPlugin,
    config: {
      stateKeys: ['draws', 'filteredDraws', 'offline'], // Incluye estado offline
      events: {
        onDrawSelect: 'draw:selected',
        onRefresh: 'draws:refresh_requested',
        onFinancialStateRequest: 'offline:request_state', // Nuevo
      }
    }
  },
  {
    slot: 'sync-status',
    component: OfflineSyncPlugin, // Nuevo plugin
    config: {
      stateKeys: ['offline'],
      events: {
        onStateChanged: 'offline:state_changed',
      }
    }
  }
];
```

---

## 4. CAPA DE SERVICIOS

### 4.1 Arquitectura de Servicios

```typescript
// shared/services/offline/index.ts

// Servicio principal - API pública
export class OfflineFinancialService {
  constructor(
    private storage: OfflineStorageService,
    private calculator: FinancialStateCalculator,
    private syncWorker: AsyncSyncWorker,
    private apiClient: BetApiClient
  ) {}
  
  async placeBet(betData: CreateBetDTO): Promise<PendingBet>;
  async getDrawState(drawId: string): Promise<DrawFinancialState>;
  async syncNow(): Promise<SyncResult>;
  async hasPendingChanges(): Promise<boolean>;
  onStateChange(callback: StateChangeCallback): Unsubscribe;
}

// Servicios internos
class OfflineStorageService {
  // Abstracción sobre AsyncStorage
  async getPendingBets(): Promise<PendingBet[]>;
  async savePendingBet(bet: PendingBet): Promise<void>;
  async updatePendingBet(localId: string, updates: Partial<PendingBet>): Promise<void>;
  async getDrawState(drawId: string): Promise<DrawFinancialState | null>;
  async saveDrawState(state: DrawFinancialState): Promise<void>;
  async getSyncQueue(): Promise<SyncQueueItem[]>;
  async addToQueue(item: SyncQueueItem): Promise<void>;
  async updateQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void>;
}

class FinancialStateCalculator {
  calculateDrawState(
    drawId: string,
    localBets: PendingBet[],
    serverState?: ServerFinancialState
  ): DrawFinancialState;
  
  recalculateAllStates(pendingBets: PendingBet[]): Record<string, DrawFinancialState>;
}

class AsyncSyncWorker {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  
  start(intervalMs: number = 5000): void;
  stop(): void;
  private async processQueue(): Promise<void>;
  private async syncItem(item: SyncQueueItem): Promise<void>;
  private handleSyncError(item: SyncQueueItem, error: Error): void;
}
```

### 4.2 Flujo de Servicios

```
┌─────────────────────────────────────────────────────────────────┐
│                    OfflineFinancialService                      │
│                         (Fachada)                               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌──────────────┐ ┌──────────┐ ┌─────────────┐
│   Storage    │ │ Calculator│ │   Worker    │
│   Service    │ │           │ │             │
└──────┬───────┘ └────┬──────┘ └──────┬──────┘
       │              │               │
       ▼              ▼               ▼
┌──────────────┐ ┌──────────┐ ┌─────────────┐
│ AsyncStorage │ │   Math   │ │  Bet API    │
│ (Local)      │ │   Logic  │ │  (Remote)   │
└──────────────┘ └──────────┘ └─────────────┘
```

---

## 5. MANEJO DE EVENTOS Y SUSCRIPCIONES

### 5.1 Eventos del Sistema

| Evento | Origen | Destino | Descripción |
|--------|--------|---------|-------------|
| `BET_PLACED_LOCAL` | BetForm | OfflinePlugin | Nueva apuesta guardada localmente |
| `FINANCIAL_STATE_UPDATED` | OfflinePlugin | Host Store | Estado financiero cambió |
| `SYNC_STARTED` | AsyncWorker | OfflinePlugin | Inició sincronización |
| `SYNC_COMPLETED` | AsyncWorker | OfflinePlugin | Item sincronizado exitosamente |
| `SYNC_ERROR` | AsyncWorker | OfflinePlugin | Error en sincronización |
| `ONLINE_STATUS_CHANGED` | NetInfo | AsyncWorker | Cambio de conectividad |
| `REQUEST_FINANCIAL_STATE` | DrawsList | OfflinePlugin | Solicitud de estado financiero |

### 5.2 Suscripciones TEA

```typescript
// OfflinePlugin subscriptions.ts
export const subscriptions = (model: Model): Sub<Msg> => {
  return Sub.batch([
    // Suscripción a cambios de conectividad
    NetInfo.subscribe((isOnline) => ({
      type: 'ONLINE_STATUS_CHANGED',
      isOnline
    })),
    
    // Suscripción a intervalos de sync (si el worker está activo)
    model.workerStatus === 'running'
      ? Time.every(5000, () => ({ type: 'SYNC_TICK' }))
      : Sub.none(),
    
    // Suscripción a eventos del Host
    HostEvents.subscribe('PLACE_BET', (betData) => ({
      type: 'BET_PLACED_REQUESTED',
      betData
    }))
  ]);
};
```

---

## 6. ESTRATEGIA DE IMPLEMENTACIÓN POR FASES

### Fase 1: Infraestructura Core (Días 1-3)
- [ ] Crear tipos TypeScript para PendingBet, DrawFinancialState, SyncQueueItem
- [ ] Implementar OfflineStorageService con AsyncStorage
- [ ] Implementar FinancialStateCalculator
- [ ] Tests unitarios para cálculos financieros

### Fase 2: Async Sync Worker (Días 4-6)
- [ ] Implementar AsyncSyncWorker con intervalos
- [ ] Implementar lógica de reintentos con backoff
- [ ] Integrar con BetApiClient (idempotency keys)
- [ ] Tests de integración para flujos de sync

### Fase 3: Plugin Offline TEA (Días 7-9)
- [ ] Crear OfflineSyncPlugin con Model, Update, View
- [ ] Implementar mensajes TEA (INIT_WORKER, SYNC_STARTED, etc.)
- [ ] Integrar con Host Store mediante Slot
- [ ] Tests de componentes TEA

### Fase 4: Integración DrawsList (Días 10-11)
- [ ] Modificar DrawsListPlugin para leer estado offline
- [ ] Agregar indicadores visuales de sync en DrawItem
- [ ] Implementar mensajes inter-plugin (REQUEST_FINANCIAL_STATE)
- [ ] Tests de integración entre plugins

### Fase 5: UI/UX y Polish (Días 12-13)
- [ ] Crear componente SyncStatusIndicator
- [ ] Agregar pantalla de "Estado de Sincronización"
- [ ] Implementar manejo de errores visibles
- [ ] Tests E2E para flujos completos

### Fase 6: Backend (Días 14-15)
- [ ] Agregar endpoint X-Idempotency-Key en POST /api/bets/
- [ ] Crear endpoint GET /api/sync/status/
- [ ] Implementar validación de duplicados
- [ ] Tests de API

---

## 7. DECISIONES DE DISEÑO PENDIENTES

| Decisión | Opciones | Recomendación |
|----------|----------|---------------|
| **Estado Global** | Zustand vs Context | Zustand (consistente con TEA) |
| **Frecuencia Sync** | Fija 5s vs Adaptativa | Fija 5s (más simple, predecible) |
| **Encriptación Local** | Sí vs No | No (dispositivos controlados, app interna) |
| **Límite Apuestas Offline** | Sin límite vs 100 | 500 apuestas (balance funcionalidad/storage) |
| **Conflict Resolution** | Server Wins vs Merge | Server Wins (más simple, consistente) |
| **UI Offline Indicator** | Badge vs Toast vs Banner | Badge en tarjeta + Banner global |

---

## 8. RIESGOS Y MITIGACIÓN

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Race conditions en LocalStorage | Alto | Implementar cola de operaciones async |
| Datos inconsistentes post-sync | Alto | Validación checksum + reconciliación |
| Memory leaks en worker | Medio | Cleanup apropiado en useEffect/destroy |
| LocalStorage quota exceeded | Medio | LRU eviction + límite de apuestas |
| Sync loop infinito | Alto | Max reintentos + circuit breaker |
| Usuario cierra app durante sync | Medio | Transactions atómicas + recovery |

---

## 9. DEPENDENCIAS Y REQUERIMIENTOS

### Nuevas Dependencias
```json
{
  "uuid": "^9.0.0",
  "@types/uuid": "^9.0.0",
  "date-fns": "^2.30.0"
}
```

### Requerimientos Backend
- Header `X-Idempotency-Key` en POST /api/bets/
- Endpoint GET /api/sync/status/{localId}
- Respuesta de error estandarizada para conflictos

### Requerimientos Testing
- Jest mocks para AsyncStorage
- MSW (Mock Service Worker) para API calls
- React Native Testing Library para componentes

---

## 10. EJEMPLO DE FLUJO COMPLETO

```
1. Usuario abre app (sin conexión)
   └── App inicia
       └── OfflineSyncPlugin se monta
           ├── Carga PendingBets de LocalStorage
           ├── Recalcula DrawFinancialStates
           ├── Inicia AsyncSyncWorker (espera conexión)
           └── Emite 'FINANCIAL_STATE_UPDATED' por cada draw

2. Usuario crea apuesta
   └── BetForm dispatch 'PLACE_BET'
       └── OfflineFinancialService.placeBet()
           ├── Genera localId (uuid)
           ├── Calcula comisión/impacto financiero
           ├── Guarda en LocalStorage (@pending_bets)
           ├── Actualiza DrawFinancialState
           ├── Agrega a SyncQueue
           └── Emite evento 'BET_PLACED_LOCAL'

3. DrawsListPlugin actualiza UI
   └── Recibe 'FINANCIAL_STATE_UPDATED'
       ├── Lee nuevo estado de Host Store
       ├── Re-renderiza DrawItem
       └── Muestra indicador "1 pendiente"

4. Regresa conexión
   └── NetInfo detecta online
       └── AsyncSyncWorker.resume()
           └── ProcessQueue()
               ├── Obtiene items pendientes
               ├── POST /api/bets/ con idempotency key
               ├── Si éxito: actualiza status, emite 'SYNC_COMPLETED'
               └── Si error: incrementa retry, programa reintento

5. UI se actualiza
   └── Recibe 'SYNC_COMPLETED'
       ├── Actualiza PendingBet status → 'synced'
       ├── Recalcula DrawFinancialState
       ├── Remueve de SyncQueue
       └── Actualiza indicador visual → "✓ sync"
```

---

**Aprobación de Arquitectura**: _________________

**Fecha**: _________________

**Notas**: _________________