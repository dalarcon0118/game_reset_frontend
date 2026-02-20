Feature: Eliminación de Duplicidad en Almacenamiento Offline

  Como desarrollador
  Quiero unificar el almacenamiento de apuestas pendientes en el sistema V2 (OfflineFinancialService)
  Para evitar inconsistencias de datos y eliminar código legado (V1).

  Background:
    Given que existen dos sistemas de almacenamiento offline: "V1 (offline_storage.ts)" y "V2 (offline/storage.service.ts)"
    And "BetService.create" escribe en ambos sistemas secuencialmente

  Scenario: Migración de escritura a V2 exclusivo
    When modifico "BetService.create"
    Then debe llamar solo a "OfflineFinancialService.placeBet"
    And no debe llamar a "BetOffline.savePendingBet" (V1)

  Scenario: Deprecación de V1
    Given que la escritura en V1 ha sido eliminada
    When verifico los consumidores de lectura de V1
    Then debo marcar "frontend/shared/services/offline_storage.ts" como @deprecated
    And debo planificar la migración de los lectores restantes a V2
