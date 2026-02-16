# Resumen de Implementación: Sistema Offline-First para Estados Financieros

## Propósito

Resolver el problema donde el backend filtra los datos financieros por estructura del usuario, retornando `$0` cuando no existen apuestas registradas para esa estructura específica. El sistema permite:

1. **Calcular estados financieros localmente** sin depender exclusivamente del servidor
2. **Combinar datos locales + servidor** para mostrar totales reales
3. **Operar offline** creando apuestas que se sincronizan automáticamente
4. **Visualizar el estado de sincronización** en tiempo real

---

## Arquitectura

### Componentes Principales

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SISTEMA OFFLINE-FINANCIAL                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────┐ │
│  │   TYPES (types.ts)  │    │ STORAGE SERVICE     │    │   SYNC WORKER   │ │
│  │  - PendingBetV2     │◄──►│  - LocalStorage     │◄──►│  - Interval 5s  │ │
│  │  - DrawFinancialState│   │  - CRUD operations  │    │  - Batch size 5 │ │
│  │  - SyncQueueItem    │    │  - Queue management │    │  - Retry logic  │ │
│  └─────────────────────┘    └─────────────────────┘    └─────────────────┘ │
│           │                           │                           │         │
│           └───────────────────────────┼───────────────────────────┘         │
│                                       │                                     │
│                              ┌────────▼────────┐                           │
│                              │ OFFLINE SERVICE │                           │
│                              │  (index.ts)     │                           │
│                              │                 │                           │
│                              │ • placeBet()    │                           │
│                              │ • getDrawState()│                           │
│                              │ • syncNow()     │                           │
│                              │ • EventEmitter  │                           │
│                              └────────┬────────┘                           │
│                                       │                                     │
│  ┌────────────────────────────────────┼────────────────────────────────┐   │
│  │                                    │                                │   │
│  │  ┌──────────────────┐    ┌────────▼────────┐    ┌────────────────┐ │   │
│  │  │ OFFLINESYNCPLUGIN│    │ DRAWSLISTPLUGIN │    │  SUMMARY CARD  │ │   │
│  │  │  (indicador UI)  │    │  (lista draws)  │    │  (totales)     │ │   │
│  │  │                  │    │                 │    │                │ │   │
│  │  │ • Sync status    │    │ • Offline badge │    │ • Combined     │ │   │
│  │  │ • Pending count  │    │ • Local totals  │    │   totals       │ │   │
│  │  │ • Manual sync    │    │ • Enriched data │    │ • Pending sync │ │   │
│  │  └──────────────────┘    └─────────────────┘    └────────────────┘ │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Formas de Uso

### 1. Crear una Apuesta Offline

```typescript
import { OfflineFinancialService } from '@/shared/services/offline';

// Crear apuesta sin esperar respuesta del servidor
const pendingBet = await OfflineFinancialService.placeBet({
  drawId: '123',
  numbers: ['12', '34', '56'],
  amount: 100,
  betType: 'direct',
  structureId: '456'
});

// La apuesta se guarda localmente y se agrega a la cola de sincronización
// El estado financiero del sorteo se actualiza inmediatamente
```

### 2. Obtener Estado Financiero Combinado

```typescript
// Obtener estado que combina servidor + local
const state = await OfflineFinancialService.getDrawState('123');

console.log(state.combined.totalCollected);  // Total combinado
console.log(state.local.totalCollected);     // Solo local
console.log(state.server?.totalCollected);   // Solo servidor
console.log(state.combined.pendingSync);     // ¿Hay cambios pendientes?
```

### 3. Suscribirse a Cambios

```typescript
// Escuchar cambios en un sorteo específico
const unsubscribe = OfflineFinancialService.onStateChange('123', (event) => {
  console.log('Cambio en sorteo 123:', event.state.combined);
});

// Escuchar todos los cambios
const unsubscribeAll = OfflineFinancialService.onAnyStateChange((event) => {
  console.log('Cambio en sorteo', event.drawId, event.changeType);
});
```

### 4. Controlar el Sync Worker

```typescript
// Iniciar sincronización automática (cada 5 segundos)
await OfflineFinancialService.startSyncWorker({ syncInterval: 5000 });

// Pausar sincronización
await OfflineFinancialService.pauseSyncWorker();

// Reanudar
await OfflineFinancialService.resumeSyncWorker();

// Forzar sincronización manual inmediata
const result = await OfflineFinancialService.syncNow();
console.log('Procesadas:', result.processed, 'Exitosas:', result.succeeded);
```

### 5. Usar el Plugin de Sincronización (UI)

```tsx
import { OfflineSyncPlugin } from '@/features/listero/dashboard/plugins/offline_sync_plugin';

// En el dashboard
<OfflineSyncPlugin.Component
  context={pluginContext}
  config={{
    showInHeader: true,     // Mostrar indicador en header
    showDetails: true,      // Permitir expandir detalles
  }}
/>
```

**El plugin muestra:**
- ✅ **Sincronizado** - Verde, todo en sync
- 🔄 **Sincronizando...** - Azul, proceso activo
- ⏸️ **N pendientes** - Naranja, apuestas por sincronizar
- ⚠️ **Error de sync** - Rojo, fallos en sincronización

### 6. Acceso a Estadísticas

```typescript
const stats = await OfflineFinancialService.getSyncStats();

console.log({
  pending: stats.pendingBets,      // Apuestas pendientes
  syncing: stats.syncingBets,      // En proceso de sync
  errors: stats.errorBets,         // Con error
  syncedToday: stats.syncedToday,  // Sincronizadas hoy
  queueLength: stats.queueLength,  // Tamaño de cola
  lastSync: stats.timeSinceLastSync, // Tiempo desde último sync
});
```

---

## Flujo de Datos

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Usuario    │────►│  Crear Bet  │────►│  Guardar    │────►│  Calcular   │
│  UI         │     │  (offline)  │     │  Local      │     │  Impacto $  │
└─────────────┘     └─────────────┘     └──────┬──────┘     └──────┬──────┘
                                               │                    │
                                               │              ┌─────▼─────┐
                                               │              │  Emitir   │
                                               │              │  Evento   │
                                               │              └─────┬─────┘
                                               │                    │
                                               │              ┌─────▼─────┐
                                               │              │  UI se    │
                                               │              │  actualiza│
                                               │              │  (badge)  │
                                               │              └───────────┘
                                               │
                                               │              ┌─────────────┐
                                               └─────────────►│  Agregar a  │
                                                              │  Sync Queue │
                                                              └──────┬──────┘
                                                                     │
                              ┌──────────────────────────────────────┘
                              │
┌─────────────┐     ┌─────────▼─────┐     ┌─────────────┐     ┌─────────────┐
│   Backend   │◄────│  Sync Worker  │◄────│  Procesar   │◄────│   Cola de   │
│   (API)     │     │  (5s interval)│     │  Batch      │     │   Sync      │
└──────┬──────┘     └───────────────┘     └─────────────┘     └─────────────┘
       │
       │ Response
       │
┌──────▼──────┐     ┌─────────────┐     ┌─────────────┐
│  Actualizar │────►│  Marcar     │────►│  Notificar  │
│  BackendId  │     │  como       │     │  Éxito      │
│             │     │  Synced     │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## Estructura de Archivos

```
frontend/
├── shared/services/offline/
│   ├── types.ts              # Tipos core (PendingBetV2, DrawFinancialState)
│   ├── storage.service.ts    # LocalStorage CRUD
│   ├── sync.worker.ts        # Worker de sincronización
│   └── index.ts              # Servicio principal (OfflineFinancialService)
│
└── features/listero/dashboard/plugins/
    ├── offline_sync_plugin/   # Plugin TEA para indicador de sync
    │   ├── types.ts
    │   ├── model.ts
    │   ├── msg.ts
    │   ├── update.ts
    │   ├── subscriptions.ts
    │   ├── view.tsx
    │   ├── store.ts
    │   └── index.ts
    │
    └── draws_list_plugin/     # Plugin de lista de sorteos (integrado)
        ├── model.ts            # + offlineStates, offlineSelectors
        ├── msg.ts              # + mensajes offline
        ├── update.ts           # + handlers offline
        ├── subscriptions.ts    # + suscripción a cambios offline
        ├── view.tsx            # + enrichDrawWithOfflineData
        └── views/
            └── draw_item.tsx   # + indicador visual offline
```

---

## Features Implementados

| Feature | Descripción | Archivos |
|---------|-------------|----------|
| **Cálculo de Impacto Financiero** | Calcula automáticamente el impacto $ de cada apuesta | `index.ts` |
| **Persistencia Local** | LocalStorage con clave `@game_reset/offline/v2` | `storage.service.ts` |
| **Sync Worker** | Procesa cola cada 5s, batch de 5 items | `sync.worker.ts` |
| **Retry con Backoff** | Reintentos exponenciales hasta 5 veces | `sync.worker.ts` |
| **Eventos en Tiempo Real** | EventEmitter para cambios de estado | `index.ts` |
| **Estadísticas de Sync** | Contadores de pendientes, errores, sincronizados | `index.ts` |
| **Indicador Visual** | Badge naranja con contador en cada draw | `draw_item.tsx` |
| **Totales Combinados** | Servidor + Local en tiempo real | `update.ts` |
| **Plugin TEA de Sync** | Componente reutilizable para indicador global | `offline_sync_plugin/` |

---

## Próximos Pasos (Fases Pendientes)

- **Fase 5**: UI/UX adicionales (toast notifications, sonidos, animaciones)
- **Fase 6**: Backend - Endpoint de idempotency keys para prevenir duplicados

---

## Ejemplo Completo: Flujo de Apuesta

```typescript
// 1. Usuario crea apuesta en UI (sin conexión o no)
const bet = await OfflineFinancialService.placeBet({
  drawId: 'sorteo-123',
  numbers: ['12', '34'],
  amount: 50,
  betType: 'fijo'
});

// 2. La UI se actualiza inmediatamente
//    - Badge aparece en el draw ("1 offline")
//    - Total de ventas aumenta $50
//    - Indicador global muestra "1 pendiente"

// 3. Sync Worker procesa automáticamente (cada 5s)
//    - Envía al backend con idempotency key
//    - Si éxito: marca como 'synced', remueve de pendientes
//    - Si error: incrementa retryCount, reintenta con backoff

// 4. UI se actualiza cuando cambia el estado
//    - Badge desaparece o actualiza contador
//    - Indicador global cambia a "Sincronizado"
```
