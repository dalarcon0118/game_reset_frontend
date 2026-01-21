Feature: Metadatos de Sorteos en el Admin
  Como administrador del sistema
  Quiero que el frontend procese correctamente los metadatos de los sorteos
  Para visualizar el jackpot y la configuración de UI actualizada.

  Scenario: Recepción exitosa de metadatos de un sorteo desde el backend
    Given el modelo inicial de sorteos está vacío
    When el sistema recibe un mensaje "FETCH_SUCCESS" con un sorteo que tiene jackpot de 500000 DOP
    Then el estado del sorteo debe contener el jackpot en "extra_data"
    And la moneda debe ser "DOP"
