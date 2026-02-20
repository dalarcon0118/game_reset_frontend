Feature: Manejo Robusto de Sesión Expirada y Logout

  Background:
    Given que "ApiClient" gestiona la renovación de tokens
    And "bootstrap.ts" configura el manejo global de errores

  Scenario: Fallo Irrecuperable en Refresco de Token Preventivo
    Given que el token de acceso ha expirado localmente (check isTokenExpired)
    When "ApiClient" intenta refrescar el token automáticamente (línea 197)
    And el refresco falla (ej. refresh token expirado o inválido)
    Then "ApiClient" DEBE capturar la excepción internamente
    And "ApiClient" DEBE limpiar inmediatamente los tokens en SecureStore
    And "ApiClient" DEBE invocar el callback de "onSessionExpired" (Logout Global)
    And la petición original debe ser abortada con un error controlado de "Sesión Expirada"

  Scenario: Configuración de Logout Global
    Given que la aplicación inicia en "bootstrap.ts"
    When se configura el "ApiClient"
    Then se debe registrar un callback explícito "onSessionExpired"
    And este callback debe despachar la acción "AuthMsgType.LOGOUT_REQUESTED" al store
