Feature: Unificación de Servicios de Token

  Como desarrollador
  Quiero unificar la gestión de tokens en un único servicio (TokenService)
  Para eliminar la duplicidad de código, evitar inconsistencias y simplificar el mantenimiento.

  Background:
    Given que existen dos servicios de token: "TokenService" y "TokenApi"
    And "TokenApi" accede directamente a "expo-secure-store"
    And "TokenService" envuelve a "TokenApi"
    And "ApiClient" ha sido modificado para usar "TokenService"

  Scenario: TokenService asume la responsabilidad de SecureStore
    When refactorizo "TokenService"
    Then debe importar "expo-secure-store" directamente
    And debe implementar los métodos de persistencia internamente (saveToken, getToken, clearToken, etc.)
    And debe mantener el manejo de errores y logging existente
    And no debe depender de "TokenApi"

  Scenario: Eliminación de TokenApi
    Given que "TokenService" ha absorbido toda la lógica
    When verifico que no hay otros consumidores de "TokenApi"
    Then puedo eliminar el archivo "frontend/shared/services/token/api.ts"
    And puedo eliminar la carpeta "frontend/shared/services/token" si está vacía

  Scenario: Consistencia de ApiClient
    Given que "ApiClient" ya usa "TokenService"
    When se completa la refactorización
    Then "ApiClient" debe seguir funcionando sin cambios en su código
    And las llamadas a "getAuthToken" y "setAuthToken" deben persistir correctamente en SecureStore a través de TokenService
