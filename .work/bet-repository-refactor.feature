Feature: Centralización de Lógica Online/Offline en BetRepository

  Background:
    Given que el sistema actual tiene lógica de almacenamiento dispersa en "BetService" y "BetOffline"
    And "BetRepository" existe pero no se utiliza como punto único de acceso
    And queremos eliminar la duplicidad de datos entre V1 (BetOffline) y V2 (OfflineFinancialService)

  Scenario: Unificar Escritura de Apuestas (Create)
    Given que un usuario intenta crear una apuesta
    When el servicio "BetService.create" delega la llamada a "BetRepository.placeBet"
    Then "BetRepository" debe guardar primero en "OfflineFinancialService" (V2) como fuente de verdad
    And si hay conexión, "BetRepository" debe intentar sincronizar inmediatamente con "BetApi"
    And "BetRepository" debe retornar un objeto "BetType" listo para la UI, ocultando la complejidad de "PendingBetV2"
    And NO se debe usar "BetOffline" (V1) en absoluto

  Scenario: Unificar Lectura de Apuestas (List)
    Given que la UI solicita la lista de apuestas
    When el servicio "BetService.list" delega la llamada a "BetRepository.getBets"
    Then "BetRepository" debe obtener apuestas pendientes de "OfflineFinancialService" (V2)
    And "BetRepository" debe transformarlas a "BetType" usando el mapper unificado
    And "BetRepository" debe obtener apuestas confirmadas de "BetApi" si hay conexión
    And "BetRepository" debe retornar una lista combinada y ordenada

  Scenario: Eliminación de Código Muerto
    Given que la refactorización esté completa
    Then el archivo "frontend/shared/services/bet/offline.ts" (V1) debe ser eliminado
    And "BetService" debe quedar como una capa delgada que solo orquesta o valida, delegando la persistencia al repositorio
