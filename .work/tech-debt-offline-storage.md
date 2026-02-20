# Deuda Técnica: Duplicidad en Almacenamiento Offline de Apuestas

**Fecha:** 2026-02-18
**Estado:** CRÍTICO (Riesgo de corrupción de datos)
**Archivos Afectados:**
- `frontend/shared/services/bet.ts`
- `frontend/shared/services/bet/offline.ts` (Legacy V1)
- `frontend/shared/services/offline/storage.service.ts` (Nuevo V2)

## 1. Análisis del Problema
Actualmente, `BetService` implementa una estrategia de escritura dual para mantener compatibilidad hacia atrás durante la transición al nuevo sistema financiero offline.

### Escritura Dual (Create)
En `BetService.create`, cada apuesta se guarda dos veces:
1.  **V2 (Primary):** `OfflineFinancialService.placeBet` -> SQLite/AsyncStorage estructurado.
2.  **V1 (Legacy):** `BetOffline.savePendingBet` -> AsyncStorage plano.

### Lectura Híbrida (List)
En `BetService.list`, se recuperan apuestas de ambas fuentes y se intenta deduplicar en memoria basándose en `offlineId`. Esto es ineficiente y propenso a errores si los IDs no coinciden perfectamente.

## 2. Riesgos Identificados
*   **Inconsistencia de Datos:** Si una escritura falla en V2 pero tiene éxito en V1 (o viceversa), el estado de la aplicación queda corrupto.
*   **Performance:** Doble I/O en cada creación de apuesta. La lectura requiere procesar dos listas y fusionarlas.
*   **Sincronización:** Existen dos colas de sincronización potenciales. Si `BetOffline` intenta sincronizar y `OfflineFinancialService` también, se pueden duplicar las apuestas en el backend.

## 3. Plan de Migración y Limpieza

### Fase 1: Validación de V2 (Completada)
El sistema V2 (`OfflineFinancialService`) ya está implementado y en uso paralelo.

### Fase 2: Unificación de Lectura (Siguiente Paso)
Modificar `BetService.list` para leer **exclusivamente** de `OfflineFinancialService`.
*   *Acción:* Eliminar llamada a `BetOffline.getPendingBets()`.
*   *Fallback:* Si es necesario migrar datos antiguos, crear un script de migración "one-off" al inicio de la app, no en cada lectura.

### Fase 3: Eliminación de Escritura Legacy
Modificar `BetService.create` para dejar de llamar a `BetOffline.savePendingBet`.
*   *Acción:* Eliminar líneas 41-42 de `bet.ts`.
*   *Verificación:* Asegurar que `legacyPendingBet` se construya desde la respuesta de V2.

### Fase 4: Limpieza de Código Muerto
Una vez que V1 no se usa para leer ni escribir:
1.  Eliminar `frontend/shared/services/bet/offline.ts`.
2.  Eliminar `frontend/shared/services/offline_storage.ts` (si solo lo usaba apuestas).
3.  Limpiar `BetOffline` imports en todo el proyecto.

## 4. Recomendación Inmediata
Proceder con la **Fase 3** inmediatamente para detener la "hemorragia" de datos duplicados, asumiendo que V2 es estable.
