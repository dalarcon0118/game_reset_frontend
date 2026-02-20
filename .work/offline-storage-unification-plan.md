# Especificación de Solución: Unificación de Almacenamiento Offline

## 1. Problem Framing
**Definición**: Actualmente, `BetService` escribe y lee datos de dos fuentes de almacenamiento offline simultáneamente:
1.  **BetOffline (V1)**: Sistema legado basado en `AsyncStorage` directo con estructura plana.
2.  **OfflineFinancialService (V2)**: Nuevo sistema robusto con cola de sincronización, transacciones y manejo de saldo.

**Impacto**:
*   Duplicidad de datos y consumo de almacenamiento.
*   Riesgo de inconsistencia (si una escritura falla y la otra no).
*   Complejidad de mantenimiento.
*   `BetRepository` ya usa V2, pero `BetService` (usado por la UI) sigue dependiendo de V1 para la lectura/listado.

**Objetivo**:
*   Eliminar `BetOffline` (V1) completamente.
*   Unificar toda la lógica en `OfflineFinancialService` (V2).
*   Adaptar la salida de datos para que la UI no se rompa.

**Non-goals**:
*   No se migrarán apuestas históricas V1 que no estén ya en V2 (se asume que V2 ha estado corriendo en paralelo suficiente tiempo).

---

## 2. Domain Modeling
**Entidades Core**:
*   **PendingBetV2** (Source of Truth): Estructura rica definida en `offline/types.ts`. Contiene estado de sincronización, timestamps numéricos y detalles financieros.
*   **BetType** (View Model): Estructura plana usada por la UI (`src/types.ts`).

**Transformación**:
Necesitamos un **Mapper** robusto que convierta `PendingBetV2[]` -> `BetType[]`.
*   V1 `flattenPendingBets` aplanaba apuestas complejas (parlets, etc.) en múltiples entradas visuales.
*   El nuevo Mapper replicará esta lógica usando `PendingBetV2` como entrada.

---

## 3. Solution Proposal

### A. Arquitectura
1.  **Eliminación**: Borrar `frontend/shared/services/bet/offline.ts`.
2.  **Mapeo**: Crear `frontend/shared/services/bet/mapper.ts` con lógica de transformación V2 -> UI.
3.  **Refactorización**: Modificar `frontend/shared/services/bet.ts` para inyectar `OfflineFinancialService` y usar el Mapper.

### B. Data Flow
*   **Escritura**: UI -> BetService -> OfflineFinancialService (V2).
*   **Lectura**: UI -> BetService -> OfflineFinancialService (V2) -> Mapper -> UI (BetType[]).

### C. Impacted Modules
*   `frontend/shared/services/bet.ts` (Lógica principal).
*   `frontend/shared/services/bet/offline.ts` (A eliminar).
*   `frontend/shared/services/bet/mapper.ts` (Nuevo/Extendido).

---

## 4. Critical Evaluation
**Riesgos**:
*   **Pérdida de datos legados**: Si un usuario tiene apuestas V1 pendientes que *nunca* se escribieron en V2 (antes de que V2 existiera), estas desaparecerán de la lista "Pendientes".
    *   *Evaluación*: Bajo riesgo si V2 lleva activo varias versiones.
*   **UI Compatibility**: Si el mapper falla en algún caso borde (ej. Parlets complejos), la UI podría crashear al renderizar.
    *   *Mitigación*: Tests manuales o unitarios del mapper.

**Alternativas**:
*   Mantener V1 solo para lectura (Read-Only) y V2 para escritura.
    *   *Desventaja*: Mantiene deuda técnica y código muerto. No recomendado.

---

## 5. Agreement Gate
¿Deseas proceder con este plan de unificación y eliminación de V1?
