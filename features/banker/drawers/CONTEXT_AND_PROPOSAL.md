# Contexto de Desarrollo y Propuesta: Filtros de Sorteos (Banker)

## 1. Estado Actual (Resumen de Correcciones)
- **Bucle Infinito Solucionado**: Se implementó una cláusula de guardia en `triggerFetch` ([update.ts](file:///Users/davidmartinez/develop/Active-projects/game_reset/frontend/features/banker/drawers/core/update.ts)) y se memoizaron los selectores en la vista.
- **Redundancia Eliminada**: Se eliminó `use_drawer.ts` y se integró la lógica de confirmación directamente en el flujo de la vista.
- **Arquitectura TEA**: El estado se maneja mediante `Model`, `Msg` y `Update`. La vista es una función pura del modelo a través de `selectDrawersViewModel`.
- **Agrupación Capa 1**: Implementada la normalización por prefijo del nombre del sorteo (ej. "NY-12" -> "NY").

## 2. Refinamiento Arquitectónico (Filtros y Agrupación)

### A. Modelo (Model)
Se expandirá el estado para soportar múltiples criterios de filtrado de forma escalable:
```typescript
filters: {
  status: string | null;      // 'open', 'closed', etc.
  drawType: string | null;    // Para futura integración con draw_type real
}
```

### B. Mensajes (Msg)
Se añadirán mensajes declarativos para la interacción del usuario:
- `SET_STATUS_FILTER`: Cambia el filtro de estado.
- `CLEAR_FILTERS`: Resetea todos los filtros.

### C. Lógica de Vista (ViewModel Selector)
El `selectDrawersViewModel` en [model.ts](file:///Users/davidmartinez/develop/Active-projects/game_reset/frontend/features/banker/drawers/core/model.ts) debe:
1. Filtrar los sorteos crudos según el estado del modelo.
2. Agrupar los resultados filtrados.
3. Calcular los metadatos necesarios (ej. cantidad de sorteos por grupo).

## 3. Optimización de Rendimiento y UX (Mobile Design)
Siguiendo las reglas de **Antigravity Kit**:
- **FlatList vs ScrollView**: Reemplazaremos el `ScrollView` actual por un `FlatList` con `renderItem` memoizado para evitar problemas de memoria en listas largas.
- **Touch Targets**: Los chips de filtro en `FilterTopBar` tendrán un área táctil mínima de 44pt.
- **Feedback Visual**: Uso de `RemoteData` para estados de carga y error sin "parpadeos" de UI.

## 4. Plan de Verificación
1. **Gate 1**: Verificar que al cambiar el filtro, la lista se actualice instantáneamente sin disparar nuevas peticiones a la API (filtrado en cliente).
2. **Gate 2**: Confirmar que la navegación por fecha mantenga o limpie los filtros según se desee (comportamiento esperado: mantener).
3. **Gate 3**: Pruebas de performance con >50 sorteos para asegurar 60 FPS durante el scroll.

---
**Próximo Paso**: Proceder con la implementación técnica una vez aprobado este documento.
