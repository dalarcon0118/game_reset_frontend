Feature: Unificación de Almacenamiento Offline
  Como desarrollador
  Quiero unificar el almacenamiento de apuestas en un solo servicio (OfflineFinancialService)
  Para evitar inconsistencia de datos y mejorar el rendimiento

  Scenario: Crear nueva apuesta (Escritura Unificada)
    Given que el dispositivo está offline u online
    When el usuario crea una nueva apuesta
    Then la apuesta debe persistirse en "OfflineFinancialService" (V2)
    And la apuesta NO debe persistirse en "BetOffline" (V1)
    And la apuesta debe tener un ID único compatible con el backend

  Scenario: Listar apuestas (Lectura Unificada)
    Given que existen apuestas guardadas localmente
    When el usuario consulta el historial de apuestas
    Then el sistema debe recuperar las apuestas desde "OfflineFinancialService"
    And el sistema NO debe consultar "BetOffline"
    And el sistema debe devolver la lista de apuestas correctamente mapeadas

  Scenario: Sincronización (Sync Unificado)
    Given que existen apuestas pendientes de sincronización en "OfflineFinancialService"
    And hay conexión a internet
    When el servicio de sincronización se ejecuta
    Then debe enviar las apuestas pendientes al backend usando "OfflineFinancialService"
    And debe marcar las apuestas como sincronizadas en "OfflineFinancialService"
    And NO debe intentar sincronizar desde "BetOffline"
