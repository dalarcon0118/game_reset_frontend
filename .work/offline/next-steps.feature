Feature: Offline Financial Sync - Próximos Pasos de Implementación

  ===============================================================================
  SECCIÓN A: INTEGRACIÓN CON DASHBOARD
  ===============================================================================

  Background:
    Given el sistema offline está implementado
    And existe el OfflineSyncPlugin con ToastContainer y Trigger
    And el BetService.create() está integrado con OfflineFinancialService.placeBet()

  -------------------------------------------------------------------------------
  Scenario: Integrar ToastContainer en el Layout Principal
    Given el usuario abre la aplicación listero
    When el componente raíz se renderiza
    Then debe renderizar el componente `<OfflineSyncPlugin.ToastContainer />`
    And el ToastContainer debe estar posicionado en la capa superior (zIndex: 9999)
    And debe mostrar toasts slide-in desde la parte superior

  -------------------------------------------------------------------------------
  Scenario: Integrar Trigger en el Header del Dashboard
    Given el usuario está en la pantalla principal del dashboard
    And hay "N" apuestas pendientes de sincronización
    When el Header se renderiza
    Then debe mostrar el `<OfflineSyncPlugin.Trigger />`
    And el Trigger debe ser un botón flotante con:
      | propiedad | valor |
      | posición | bottom-right (24px del bottom, 24px del right) |
      | color | azul (#2196F3) |
      | border-radius | 28px |
    And debe mostrar un badge rojo con el número de pendientes
    And el botón debe tener animación de pulse cuando hay pendientes

  -------------------------------------------------------------------------------
  Scenario: Abrir Sync Status Screen desde el Trigger
    Given el usuario ve el botón de sync con "3" pendientes
    When presiona el botón flotante
    Then debe abrirse un Modal con:
      | sección | contenido |
      | header | "Estado de Sincronización" + botón cerrar |
      | stats | 4 cards: Pendientes, Sincronizando, Errores, Hoy |
      | tabs | Resumen, Pendientes, Errores |
      | footer | Botón "Forzar Sincronización" |

  -------------------------------------------------------------------------------
  Scenario: Mostrar lista de apuestas pendientes
    Given el usuario está en la Sync Status Screen
    And está en la pestaña "Pendientes"
    When la lista se renderiza
    Then debe mostrar cada apuesta con:
      | campo | descripción |
      | drawId | ID del sorteo |
      | amount | Monto formateado ($XX.XX) |
      | status | Badge "pending" amarillo |
      | timestamp | Hace cuánto se creó |

  -------------------------------------------------------------------------------
  Scenario: Mostrar lista de errores
    Given el usuario está en la Sync Status Screen
    And está en la pestaña "Errores"
    When la lista se renderiza
    Then debe mostrar cada error con:
      | campo | descripción |
      | drawId | ID del sorteo |
      | amount | Monto de la apuesta |
      | lastError | Mensaje de error en rojo |
      | retryCount | Número de intentos fallidos |

  ===============================================================================
  SECCIÓN B: TOAST NOTIFICATIONS MEJORADAS
  ===============================================================================

  -------------------------------------------------------------------------------
  Scenario: Mostrar toast de apuesta guardada offline
    Given el usuario crea una apuesta sin conexión
    When la apuesta se guarda exitosamente en LocalStorage
    Then debe mostrarse un toast con:
      | propiedad | valor |
      | type | "success" |
      | title | "Apuesta guardada offline" |
      | icon | checkmark-circle verde |
      | duration | 3000ms |
    And el toast debe hacer slide-in desde arriba

  -------------------------------------------------------------------------------
  Scenario: Mostrar toast de sincronización iniciada
    Given el Sync Worker inicia procesamiento
    When comienza a enviar apuestas al servidor
    Then debe mostrarse un toast con:
      | propiedad | valor |
      | type | "syncing" |
      | title | "Sincronizando..." |
      | icon | sync animado (rotación 360°) |
      | duration | 0 (no auto-dismiss) |
    And el toast debe desaparecer cuando termine la sincronización

  -------------------------------------------------------------------------------
  Scenario: Mostrar toast de sync completado
    Given la sincronización de batch termina exitosamente
    When se procesan "N" apuestas
    Then debe mostrarse un toast con:
      | propiedad | valor |
      | type | "success" |
      | title | "N apuestas sincronizadas" |
      | duration | 3000ms |

  -------------------------------------------------------------------------------
  Scenario: Mostrar toast de error de sync
    Given una apuesta falla al sincronizar después de 5 intentos
    When el retry count llega al límite
    Then debe mostrarse un toast con:
      | propiedad | valor |
      | type | "error" |
      | title | "Error de sincronización" |
      | message | Detalle del error |
      | duration | 0 (no auto-dismiss) |
      | action | Botón "Reintentar" |

  -------------------------------------------------------------------------------
  Scenario: Múltiples toasts en cola
    Given el usuario tiene 3 toasts activos
    When se dispara un cuarto toast
    Then solo deben mostrarse los últimos 3 toasts (MAX_TOASTS = 3)
    And el toast más antiguo debe ser reemplazado

  ===============================================================================
  SECCIÓN C: ARQUITECTURA DE DATOS
  ===============================================================================

  -------------------------------------------------------------------------------
  Scenario: Flujo de datos - Offline a Online
    Given el usuario crea una apuesta sin conexión
    When la apuesta se guarda en LocalStorage
    Then debe generar un idempotencyKey único (UUID v4)
    And el estado debe ser "pending_sync"
    And cuando isConnected = true, enviar inmediatamente al backend
    And al recibir respuesta exitosa, remover de LocalStorage

  -------------------------------------------------------------------------------
  Scenario: Errores de red - Frontend retry local
    Given el frontend intenta sincronizar una apuesta
    When hay error de red (timeout, 5xx, no conexión)
    Then el frontend debe reintentar con exponential backoff:
      | intento | delay |
      | 1 | inmediato |
      | 2 | 1000ms |
      | 3 | 2000ms |
      | 4 | 4000ms |
      | 5 | 8000ms |
    And si todos fallan, mantener en LocalStorage con status "pending"

  -------------------------------------------------------------------------------
  Scenario: Errores de negocio - Backend Dead Letter Queue
    Given el backend recibe una apuesta
    When hay error de negocio (validación, servidor, datos inválidos)
    Then debe retornar error 4xx/5xx
    And guardar en Redis DLQ:
      """
      Key: listero:dlq:{idempotencyKey}
      TTL: 7 días
      Value: { localId, drawId, amount, error, timestamp }
      """
    And el frontend remueve de LocalStorage al recibir error del backend

  -------------------------------------------------------------------------------
  Scenario: Verificación de sync desde frontend
    Given el usuario está online
    When consulta el estado de sincronización
    Then debe llamar GET /api/bets/sync_status/{id}
    And recibir respuesta con synced=true/false
    And si synced=true desde backend, remover de LocalStorage

  -------------------------------------------------------------------------------
  Scenario: Cleanup de LocalStorage
    Given el usuario cierra y abre la app
    When existen PendingBets con synced=true en backend
    Then deben removerse automáticamente de LocalStorage
    And mantener solo bets pendientes de sync

  -------------------------------------------------------------------------------
  Scenario: Batch processing optimizado
    Given el Sync Worker tiene 50 apuestas pendientes
    When procesa la cola
    Then debe procesar en batches de 5 items
    And esperar 100ms entre cada item
    And continuar hasta que la cola esté vacía
    And reportar progreso al store

  ===============================================================================
  SECCIÓN D: MANEJO DE ERRORES MEJORADO
  ===============================================================================

  -------------------------------------------------------------------------------
  Scenario: Retry individual desde lista de errores
    Given el usuario ve una apuesta en "Errores"
    When presiona el botón "Reintentar" en esa apuesta
    Then debe ejecutarse syncNow() solo para ese item
    And la apuesta debe removerse de la lista si tiene éxito
    And debe mostrarse toast con el resultado

  -------------------------------------------------------------------------------
  Scenario: Retry de todos los errores
    Given el usuario está en Sync Status Screen
    And hay errores acumulados en la lista
    When presiona "Limpiar Errores"
    Then debe removerse toda la lista de la errores de UI
    And las apuestas deben volver a la cola de pending
    And Sync Worker debe comenzar a reprocesar

  -------------------------------------------------------------------------------
  Scenario: Pantalla de detalles de error
    Given una apuesta tiene error de sincronización
    When el usuario presiona en la apuesta
    Then debe mostrarse un modal con detalles:
      | campo | descripción |
      | localId | UUID local |
      | drawId | ID del sorteo |
      | amount | Monto |
      | numbers | Números jugados |
      | lastError | Mensaje de error completo |
      | retryCount | Intentos realizados |
      | firstAttempt | Timestamp primer intento |
      | lastAttempt | Timestamp último intento |

  ===============================================================================
  SECCIÓN E: CONECTIVIDAD Y NETWORK
  ===============================================================================

  -------------------------------------------------------------------------------
  Scenario: Detección automática de conectividad
    Given el dispositivo pierde conexión a internet
    When NetInfo detecta isConnected = false
    Then el Sync Worker debe:
      | acción | razón |
      | pausar procesamiento | no hay conexión |
      | mostrar toast | "Sin conexión" |
      | continuar cuando恢复 conexión |

  -------------------------------------------------------------------------------
  Scenario: Recovery automático al recuperar conexión
    Given el Sync Worker está en pausa
    When NetInfo detecta isConnected = true
    Then debe ejecutarse syncNow() inmediatamente
    And procesar toda la cola pendiente

  ===============================================================================
  SECCIÓN F: INTEGRACIÓN CON SUMMARY PLUGIN
  ===============================================================================

  -------------------------------------------------------------------------------
  Scenario: Totales combinados en Summary Card
    Given el usuario está en el dashboard
    When se renderiza el Summary Plugin
    Then debe mostrar totales combinados:
      """
      combined.totalCollected = server.totalCollected + local.totalCollected
      combined.pendingSync = local.pendingCount > 0
      """
    And debe mostrar indicador de sync status junto al total

  -------------------------------------------------------------------------------
  Scenario: Breakdown de totales
    Given el usuario expande el Summary Card
    When ve los detalles
    Then debe mostrar desglose:
      | concepto | fuente |
      | "Del servidor" | server.totalCollected |
      | "Pendiente sync" | local.totalCollected |
      | "Total" | combined.totalCollected |

  ===============================================================================
  SECCIÓN G: TESTING Y QA
  ===============================================================================

  -------------------------------------------------------------------------------
  Scenario: Tests unitarios para Sync Worker
    Given el proyecto tiene Jest configurado
    When se ejecutan los tests
    Then deben cubrir:
      | módulo | casos de prueba |
      | sync.worker.ts | interval processing, batch, retry logic |
      | storage.service.ts | CRUD operations, migrations |
      | offline-financial-service.ts | placeBet, getDrawState, events |

  -------------------------------------------------------------------------------
  Scenario: Tests de integración para API
    Given MSW (Mock Service Worker) está configurado
    When se ejecutan tests de API
    Then deben probar:
      | escenario | resultado esperado |
      | POST /api/bets/ con idempotency key único | 201 Created |
      | POST /api/bets/ con idempotency key duplicado | 200 con bets existentes |
      | GET /api/bets/sync_status/{id} existente | synced=true |
      | GET /api/bets/sync_status/{id} pendiente | synced=false |

  -------------------------------------------------------------------------------
  Scenario: Tests E2E para flujos offline
    Given la app está running en emulador
    When se prueba el flujo completo:
      | paso | acción |
      | 1 | Crear apuesta sin conexión |
      | 2 | Verificar toast "guardada offline" |
      | 3 | Verificar badge en draw card |
      | 4 | Habilitar conexión |
      | 5 | Verificar sync automático |
      | 6 | Verificar toast "sincronizada" |
    Then todos los pasos deben completar exitosamente

  ===============================================================================
  SECCIÓN H: METRICAS Y MONITOREO
  ===============================================================================

  -------------------------------------------------------------------------------
  Scenario: Dashboard de métricas de sync
    Given el usuario tiene acceso a estadísticas
    When accede a la pantalla de métricas
    Then debe mostrar:
      | métrica | descripción |
      | syncRate | Porcentaje de syncs exitosos |
      | avgSyncTime | Tiempo promedio de sincronización |
      | errorRate | Porcentaje de errores |
      | pendingCount | Apuestas pendientes actuales |
      | lastSuccessfulSync | Timestamp último sync exitoso |

  -------------------------------------------------------------------------------
  Scenario: Logging de eventos
    Given el sistema está en modo desarrollo
    When ocurren eventos de sync
    Then debe logger:
      | evento | nivel | formato |
      | sync_started | INFO | "[SyncWorker] Started processing batch" |
      | sync_completed | INFO | "[SyncWorker] Completed: N succeeded, M failed" |
      | sync_item_success | DEBUG | "[SyncWorker] Bet synced: localId -> backendId" |
      | sync_item_error | WARN | "[SyncWorker] Bet failed: localId, error: X" |
      | offline_bet_placed | INFO | "[OfflineService] Bet saved: localId" |

  ===============================================================================
  PRIORIDADES DE IMPLEMENTACIÓN
  ===============================================================================

  Alta Prioridad (Esta semana):
    1. [ ] Integrar ToastContainer en Layout raíz
    2. [ ] Integrar Trigger en Dashboard header
    3. [ ] Conectar BetService.create con OfflineFinancialService.placeBet
    4. [ ] Testing básico del flujo completo

  Media Prioridad (Próxima semana):
    5. [ ] Pantalla de detalles de errores
    6. [ ] Retry individual desde lista
    7. [ ] Mejoras en Toast animations
    8. [ ] Integration tests

  Baja Prioridad (Sprint futuro):
    9. [ ] Dashboard de métricas
    10. [ ] Cleanup automático avanzado
    11. [ ] Exponential backoff configurable
    12. [ ] E2E tests completos

  ===============================================================================
  SECCIÓN I: BACKEND API - DEAD LETTER QUEUE
  ===============================================================================

  -------------------------------------------------------------------------------
  Scenario: POST /api/bets/ - Crear apuesta
    Given el frontend envía una apuesta con idempotencyKey
    When el backend recibe la solicitud
    Then debe verificar si ya existe Bet con mismo idempotencyKey
    And si existe, retornar 200 con el Bet existente (idempotencia)
    And si no existe, crear el Bet
    And si hay error de validación, guardar en Redis DLQ
    And retornar 201 Created

  -------------------------------------------------------------------------------
  Redis DLQ Structure:
    """
    Key: listero:dlq:{idempotencyKey}
    Type: Hash
    TTL: 604800 segundos (7 días)
    
    Fields:
      - localId: UUID del frontend
      - drawId: ID del sorteo
      - amount: Monto de la apuesta
      - error: Mensaje de error
      - createdAt: Timestamp
      - retryCount: 0
    
    Index Key: listero:dlq:user:{userId}
    Type: Sorted Set (score = timestamp)
    """

  -------------------------------------------------------------------------------
  Endpoint: GET /api/bets/dead-letter-queue/
    Response:
      """
      {
        "count": N,
        "items": [
          {
            "idempotencyKey": "uuid",
            "localId": "uuid",
            "drawId": "draw-123",
            "amount": 100.00,
            "error": "Sorteo cancelado",
            "createdAt": "2024-01-15T10:30:00Z",
            "retryCount": 3
          }
        ]
      }
      """

  -------------------------------------------------------------------------------
  Endpoint: POST /api/bets/dead-letter-queue/{idempotencyKey}/retry
    Given existe un item en el DLQ
    When se llama al endpoint
    Then debe intentar crear la apuesta nuevamente
    And si tiene éxito, remover del DLQ
    And retornar 200 con el Bet creado
    And si falla, incrementar retryCount

  -------------------------------------------------------------------------------
  Endpoint: POST /api/bets/dead-letter-queue/{idempotencyKey}/discard
    Given existe un item en el DLQ
    When se llama al endpoint
    Then debe remover del DLQ
    And registrar en audit log
    And retornar 204 No Content

  ===============================================================================
  CRITERIOS DE ACEPTACIÓN PARA PRODUCCIÓN
  ===============================================================================

  Given el sistema completo de sync offline
  Then debe cumplir:
    | criterio | threshold |
    | Tiempo de respuesta UI tras apuesta offline | < 100ms |
    | Sincronización automática tras恢复 conexión | < 10s |
    | Toast success tras sync exitoso | 100% |
    | No duplicar bets con mismo idempotency key | 100% |
    | Datos persistidos tras cerrar app | 100% |
    | Recovery tras errores de red | 100% |

