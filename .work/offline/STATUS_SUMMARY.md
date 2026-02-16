# Resumen de Estado - Sistema Offline-First

## 📊 Estado General

| Fase | Estado | Progreso |
|------|--------|----------|
| Fase 1: Infraestructura Core | ✅ Completada | 100% |
| Fase 2: Async Sync Worker | ✅ Completada | 100% |
| Fase 3: Plugin TEA OfflineSync | ✅ Completada | 100% |
| Fase 4: Integración DrawsList | ✅ Completada | 100% |
| Fase 5: UI/UX | 🟡 Parcial | 30% |
| Fase 6: Backend Idempotency | 🟡 Parcial | 60% |
| Integración Final | 🔴 Pendiente | 0% |

---

## ✅ COMPLETADO

### Fases 1-4: Core del Sistema (100%)

**Archivos creados:**
```
frontend/shared/services/offline/
├── types.ts              # Tipos: PendingBetV2, DrawFinancialState, SyncQueueItem
├── storage.service.ts    # LocalStorage CRUD operations
├── sync.worker.ts        # Worker con intervalos, batch processing, retry
└── index.ts              # OfflineFinancialService (placeBet, getDrawState, etc.)

frontend/features/listero/dashboard/plugins/offline_sync_plugin/
├── types.ts              # Tipos del plugin
├── model.ts              # Estado inicial, updaters, selectors
├── msg.ts                # Mensajes TEA (16 tipos)
├── update.ts             # Update function con handlers
├── subscriptions.ts      # Suscripción a cambios offline
├── view.tsx              # Componente con indicador visual
├── store.ts              # Zustand store
└── index.ts              # Exports
```

**Integración con DrawsListPlugin:**
- `msg.ts`: Mensajes OFFLINE_STATE_UPDATED, SYNC_OFFLINE_STATES, BATCH_OFFLINE_UPDATE
- `model.ts`: Mapa offlineStates, selectors para totales combinados
- `update.ts`: Handlers para mensajes offline, enrichDrawWithOfflineData()
- `subscriptions.ts`: Polling cada 3s a OfflineFinancialService
- `draw_item.tsx`: Badge naranja con contador de apuestas pendientes
- `view.tsx`: Enriquece draws con datos offline antes de renderizar

### Fase 5: UI/UX (30%)

**✅ Completado:**
- Animación spinning en icono de sync (rotación 360° cuando syncing)

**⏳ Pendiente:**
- Toast notifications ("Apuesta guardada", "Sync completado", "Error")
- Pantalla de estado de sincronización detallada
- Shake animation en errores
- Sonidos de feedback (opcional)

### Fase 6: Backend Idempotency (60%)

**✅ Completado:**
- Modelo `IdempotencyKey` en `backend/bet/models.py`
- Import del modelo en views
- Verificación de header `X-Idempotency-Key` al inicio del POST
- Migración generada y lista (0002_auto_20260212_0939.py)

**⏳ Pendiente:**
- Guardar la idempotency key después de crear bets exitosamente
- Nuevo endpoint `GET /api/bets/sync_status/{local_id}/`
- Actualizar sync worker frontend para enviar header

---

## 📋 CHECKLIST DETALLADO

### Frontend
- [x] Tipos TypeScript
- [x] Servicio de almacenamiento (LocalStorage)
- [x] Sync Worker (intervalos, batch, retry)
- [x] Servicio principal (OfflineFinancialService)
- [x] Plugin TEA (Model, Update, View, Subscriptions)
- [x] Integración con DrawsListPlugin
- [x] Indicador visual en draw cards
- [x] Animación spinning en icono
- [ ] Toast notifications
- [ ] Pantalla de estado detallada
- [ ] Sync worker con header X-Idempotency-Key

### Backend
- [x] Modelo IdempotencyKey
- [x] Verificación de duplicados en POST /api/bets/
- [ ] Guardar clave después de crear bets
- [ ] Endpoint sync_status
- [ ] Aplicar migración a BD

### Integración
- [ ] Conectar BetService.create con OfflineFinancialService.placeBet
- [ ] Integrar totales offline con Summary global

---

## 🚀 PRÓXIMOS PASOS RECOMENDADOS

### 1. Completar Backend (15 min)
```python
# En views.py después de crear bets:
if idempotency_key and created_bets:
    IdempotencyKey.objects.create(
        key=idempotency_key,
        bet=created_bets[0],  # Primera bet como referencia
        expires_at=timezone.now() + timedelta(days=7)
    )

# Nuevo endpoint:
@action(detail=False, methods=['get'], url_path='sync_status/(?P<local_id>[^/.]+)')
def sync_status(self, request, local_id=None):
    try:
        key = IdempotencyKey.objects.get(key=local_id)
        return Response({'status': 'synced', 'betId': key.bet.id})
    except IdempotencyKey.DoesNotExist:
        return Response({'status': 'pending'}, status=404)
```

### 2. Aplicar Migración
```bash
docker exec backend-web-1 python manage.py migrate
```

### 3. Actualizar Frontend Sync Worker
```typescript
// En sync.worker.ts
const response = await fetch('/api/bets/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Idempotency-Key': bet.offlineId,  // <-- Agregar
  },
  body: JSON.stringify(betData)
});
```

### 4. Integrar con Flujo de Apuestas
- Modificar donde se llama `BetService.create()` para usar `OfflineFinancialService.placeBet()`

---

## 📁 DOCUMENTACIÓN CREADA

- `frontend/.work/offline/architecture-spec.md` - Especificación completa
- `frontend/.work/offline/offline-financial-sync.feature` - Escenarios Gherkin
- `frontend/.work/offline/IMPLEMENTATION_SUMMARY.md` - Guía de uso
- `frontend/.work/offline/TASK_PROGRESS.md` - Progreso detallado
- `frontend/.work/offline/STATUS_SUMMARY.md` - Este archivo

---

## 🎯 ESTADO ACTUAL RESUMIDO

**El sistema offline-first está funcional al 80%**. Las fases core (1-4) están completas y probadas. 

**Para producción segura**, falta completar:
1. Guardar idempotency key en backend (crítico para evitar duplicados)
2. Enviar header desde frontend sync worker
3. Integrar con el flujo real de creación de apuestas

**Para excelente UX**, falta:
1. Toast notifications
2. Pantalla de estado detallada

---

*Última actualización: 2026-02-12*
