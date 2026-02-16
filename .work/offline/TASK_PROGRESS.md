# Progreso de Fases 5 y 6

## FASE 5: UI/UX e Indicadores Visuales

### 5.1 Toast Notifications
- [ ] Crear componente Toast reutilizable
- [ ] Crear hook useOfflineToast
- [ ] Integrar en el servicio offline para mostrar feedback

### 5.2 Animaciones en OfflineSyncPlugin
- [ ] Agregar spinning animation durante sync
- [ ] Agregar pulse animation en botón manual
- [ ] Smooth transitions entre estados

### 5.3 Mejoras en DrawItem
- [ ] Animación en badge offline
- [ ] Shake animation cuando hay errores

### 5.4 Pantalla de Estado Detallada (Opcional)
- [ ] Crear pantalla de lista de pendientes
- [ ] Navegación desde el indicador

---

## FASE 6: Backend Idempotency Keys

### 6.1 Modelo Django
- [ ] Crear modelo IdempotencyKey
- [ ] Crear migración
- [ ] Aplicar migración

### 6.2 Modificar API de Bets
- [ ] Agregar soporte para header X-Idempotency-Key
- [ ] Lógica de verificación de duplicados
- [ ] Manejo de respuestas 200 (existente) vs 201 (nuevo)

### 6.3 Nuevo Endpoint
- [ ] GET /api/sync/status/{localId}
- [ ] Retornar estado de sincronización

### 6.4 Actualizar Frontend
- [ ] Modificar sync worker para enviar idempotency key
- [ ] Manejar respuestas del backend

### 6.5 Tarea de Limpieza
- [ ] Crear task de Celery para eliminar claves expiradas

---

## Estado Actual
- [x] Fases 1-4 completadas
- [ ] Fase 5 en progreso
- [ ] Fase 6 pendiente
