Feature: Sistema de Estados Financieros Offline-First con Sincronización Asíncrona

  Background:
    Given el usuario está usando la aplicación en modo listero
    And el sistema tiene acceso a LocalStorage para persistencia offline
    And existe un Async Sync Worker que verifica conectividad periódicamente

  # ============================================================================
  # ESTRUCTURA DE DATOS
  # ============================================================================

  Scenario: Estructura de PendingBet en LocalStorage
    Given se crea una nueva apuesta
    Then la apuesta se guarda con los siguientes campos obligatorios:
      | campo          | tipo       | descripción                          |
      | localId        | string     | UUID generado localmente             |
      | backendId      | string?    | ID asignado por el backend           |
      | drawId         | string     | ID del sorteo                        |
      | numbers        | string[]   | Números jugados                      |
      | amount         | number     | Monto de la apuesta                  |
      | betType        | string     | Tipo de apuesta                      |
      | structureId    | string     | ID de la estructura                  |
    And incluye metadatos de sincronización:
      | campo          | tipo       | valores posibles                     |
      | status         | string     | pending, syncing, synced, error      |
      | createdAt      | number     | Timestamp de creación local          |
      | syncedAt       | number?    | Timestamp de sincronización          |
      | retryCount     | number     | Intentos de sincronización           |
      | lastError      | string?    | Último error de sincronización       |
    And calcula impacto financiero local:
      | campo          | tipo       | descripción                          |
      | financialImpact.totalCollected | number | Monto de esta apuesta    |
      | financialImpact.commission     | number | Comisión calculada       |
      | financialImpact.netAmount      | number | Monto neto               |

  Scenario: Estructura de DrawFinancialState en LocalStorage
    Given existe un sorteo con identificador drawId
    Then el estado financiero se almacena con:
      | sección   | campo          | tipo       | descripción                          |
      | metadata  | drawId         | string     | Identificador del sorteo             |
      | metadata  | lastUpdated    | number     | Timestamp última actualización       |
      | local     | totalCollected | number     | Suma de apuestas locales             |
      | local     | totalPaid      | number     | Premios pagados (calculados local)   |
      | local     | netResult      | number     | Ganancia neta local                  |
      | local     | betCount       | number     | Cantidad de apuestas locales         |
      | server    | totalCollected | number?    | Último valor conocido del servidor   |
      | server    | totalPaid      | number?    | Último valor conocido del servidor   |
      | server    | netResult      | number?    | Último valor conocido del servidor   |
      | server    | betCount       | number?    | Último valor conocido del servidor   |
      | server    | lastSync       | number?    | Timestamp última sincronización      |
      | combined  | totalCollected | number     | local + server                       |
      | combined  | totalPaid      | number     | Valor del servidor                   |
      | combined  | netResult      | number     | local + server                       |
      | combined  | betCount       | number     | local + server                       |
      | combined  | pendingSync    | boolean    | Hay cambios locales no sincronizados |

  Scenario: Estructura de SyncQueue en LocalStorage
    Given existen items pendientes de sincronización
    Then cada item en la cola tiene:
      | campo          | tipo       | descripción                          |
      | id             | string     | UUID del item en cola                |
      | type           | string     | 'bet' o 'financial_update'           |
      | entityId       | string     | ID de la entidad a sincronizar       |
      | priority       | number     | 1=alta, 5=baja                       |
      | createdAt      | number     | Timestamp de creación                |
      | attempts       | number     | Intentos realizados                  |
      | lastAttempt    | number?    | Timestamp último intento             |
      | status         | string     | pending, processing, completed, failed|

  # ============================================================================
  # FLUJO: CREAR APUESTA OFFLINE
  # ============================================================================

  Scenario: Usuario crea apuesta sin conexión
    Given el usuario está en la pantalla de crear apuesta
    And el sorteo tiene drawId = "123"
    When el usuario ingresa:
      | campo          | valor              |
      | numbers        | ["12", "34", "56"] |
      | amount         | 100                |
      | betType        | "direct"           |
    And presiona "Guardar Apuesta"
    Then el sistema:
      | paso | acción                                                            |
      | 1    | Genera localId único (UUID)                                       |
      | 2    | Calcula comisión según reglas de la estructura                    |
      | 3    | Calcula netAmount = amount - commission                           |
      | 4    | Guarda PendingBet en LocalStorage con status='pending'            |
      | 5    | Actualiza DrawFinancialState.local sumando los valores            |
      | 6    | Agrega item a SyncQueue con priority=1                            |
      | 7    | Muestra la apuesta inmediatamente en la UI (optimistic update)    |
      | 8    | Dispara Async Sync Worker                                         |
    And la UI muestra un indicador visual de "pendiente de sincronización"

  # ============================================================================
  # FLUJO: ASYNC SYNC WORKER
  # ============================================================================

  Scenario: Async Sync Worker verifica conectividad
    Given el Async Sync Worker está corriendo
    And el intervalo de verificación es de 5000ms
    When transcurren 5 segundos
    Then el worker:
      | paso | acción                                                            |
      | 1    | Verifica conectividad con el backend (ping o health check)        |
      | 2    | Si hay conexión, obtiene items pendientes de SyncQueue            |
      | 3    | Ordena items por priority (menor número = mayor prioridad)        |
      | 4    | Procesa cada item secuencialmente                                 |
      | 5    | Espera 5 segundos y repite                                        |

  Scenario: Async Sync Worker sincroniza apuesta exitosamente
    Given existe un PendingBet con status='pending'
    And hay conexión con el backend
    When el Worker procesa el item de la cola
    Then el sistema:
      | paso | acción                                                            |
      | 1    | Marca item como 'processing'                                      |
      | 2    | Envía POST /api/bets/ con los datos de la apuesta                |
      | 3    | Recibe respuesta 201 con backendId asignado                       |
      | 4    | Actualiza PendingBet: status='synced', backendId, syncedAt        |
      | 5    | Actualiza DrawFinancialState.server con datos de respuesta        |
      | 6    | Recalcula DrawFinancialState.combined                             |
      | 7    | Marca item en SyncQueue como 'completed'                          |
      | 8    | Emite evento 'financial_state:updated' para refrescar UI          |

  Scenario: Async Sync Worker maneja error de sincronización
    Given existe un PendingBet con status='pending'
    And hay error de red al sincronizar
    When el Worker intenta procesar el item
    Then el sistema:
      | paso | acción                                                            |
      | 1    | Incrementa retryCount                                             |
      | 2    | Guarda lastError con el mensaje de error                          |
      | 3    | Actualiza lastAttempt timestamp                                   |
      | 4    | Si retryCount < 3: mantiene status='pending'                      |
      | 5    | Si retryCount >= 3: cambia status='error'                         |
      | 6    | Marca item en SyncQueue como 'failed'                             |
      | 7    | Programa reintento con backoff exponencial                        |
      | 8    | Notifica a la UI con indicador de error                           |

  # ============================================================================
  # FLUJO: CÁLCULO DE ESTADO FINANCIERO
  # ============================================================================

  Scenario: Calcular estado financiero combinado
    Given existen las siguientes apuestas locales para drawId="123":
      | localId | amount | commission | netAmount |
      | abc-1   | 100    | 10         | 90        |
      | abc-2   | 200    | 20         | 180       |
    And el último estado del servidor es:
      | totalCollected | totalPaid | netResult | betCount | lastSync   |
      | 500            | 50        | 450       | 5        | 1707686400 |
    When se calcula el DrawFinancialState
    Then el resultado debe ser:
      | sección  | totalCollected | totalPaid | netResult | betCount | pendingSync |
      | local    | 300            | 0         | 270       | 2        | -           |
      | server   | 500            | 50        | 450       | 5        | -           |
      | combined | 800            | 50        | 720       | 7        | true        |

  # ============================================================================
  # FLUJO: RESOLUCIÓN DE CONFLICTOS
  # ============================================================================

  Scenario: Resolver conflicto de apuesta duplicada
    Given existe un PendingBet con localId="local-1" y status='pending'
    And el backend ya tiene una apuesta similar (mismo draw, números, monto)
    When se intenta sincronizar
    And el backend responde con error de duplicado
    Then el sistema aplica estrategia "Server Wins":
      | paso | acción                                                            |
      | 1    | Recibe backendId de la apuesta existente                          |
      | 2    | Actualiza PendingBet: backendId, status='synced'                  |
      | 3    | Elimina duplicado local                                           |
      | 4    | Actualiza DrawFinancialState.server                               |
      | 5    | Recalcula estado combinado                                        |

  # ============================================================================
  # API DEL SERVICIO
  # ============================================================================

  Scenario: API de OfflineFinancialService
    Given el servicio está inicializado
    Then expone los siguientes métodos:
      | método                          | retorno              | descripción                          |
      | placeBet(betData)               | Promise<PendingBet>  | Guarda apuesta localmente            |
      | getDrawFinancialState(drawId)   | Promise<DrawState>   | Obtiene estado combinado             |
      | syncNow()                       | Promise<SyncResult>  | Fuerza sincronización manual         |
      | hasPendingChanges()             | Promise<boolean>     | Verifica cambios pendientes          |
      | getSyncStats()                  | Promise<SyncStats>   | Estadísticas de sincronización       |
      | onFinancialStateChange(drawId, cb) | unsubscribe     | Suscripción a cambios                |

  # ============================================================================
  # INDICADORES VISUALES EN UI
  # ============================================================================

  Scenario: Estados visuales de sincronización
    Given la tarjeta financiera muestra datos de un sorteo
    Then los indicadores visuales son:
      | estado           | indicador                                    | significado                          |
      | Todo sync        | Punto verde pequeño                          | Todo sincronizado con servidor       |
      | Pendiente        | Punto amarillo + número de pendientes        | Hay cambios locales no sincronizados |
      | Error            | Punto rojo + icono de alerta                 | Error en sincronización              |
      | Sincronizando    | Spinner animado                              | Sincronización en progreso           |

  # ============================================================================
  # PERSISTENCIA Y LIMPIEZA
  # ============================================================================

  Scenario: Limpieza automática de datos antiguos
    Given existen PendingBet con status='synced' y syncedAt antiguo
    When el sistema ejecuta mantenimiento diario
    Then:
      | condición                                           | acción                           |
      | syncedAt > 7 días                                   | Eliminar de LocalStorage         |
      | status='error' y retryCount > 5                     | Mover a "dead letter queue"      |
      | SyncQueue items 'completed' > 24 horas              | Eliminar de la cola              |

  Scenario: Recuperación tras reinicio de app
    Given el usuario cierra y reabre la aplicación
    And existían PendingBet con status='pending'
    When la app inicia
    Then:
      | paso | acción                                                            |
      | 1    | Carga PendingBets desde LocalStorage                              |
      | 2    | Recalcula todos los DrawFinancialState                            |
      | 3    | Reconstruye SyncQueue con items pendientes                        |
      | 4    | Inicia Async Sync Worker                                          |
      | 5    | Muestra estado financiero inmediatamente (desde cálculos locales) |