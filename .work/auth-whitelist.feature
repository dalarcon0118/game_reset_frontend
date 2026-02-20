Feature: Configuración de Endpoints Públicos (Whitelist)

  Scenario: Permitir acceso sin token a endpoints públicos
    Given el sistema tiene configurada una lista de endpoints públicos en settings.ts
    When el cliente realiza una petición a un endpoint que está en la whitelist (ej: /auth/login/)
    Then el ApiClient NO debe intentar validar si el token de acceso ha expirado
    And el ApiClient NO debe intentar refrescar el token automáticamente
    And el ApiClient debe permitir que la petición proceda sin el header Authorization (o con él si existe, pero sin bloquear)

  Scenario: Mantener seguridad en endpoints protegidos
    Given el sistema tiene configurada una lista de endpoints públicos
    When el cliente realiza una petición a un endpoint que NO está en la whitelist (ej: /users/profile)
    Then el ApiClient debe validar la expiración del token
    And si el token expiró, debe intentar refrescarlo antes de realizar la petición
    And si no hay token válido, debe fallar o redirigir al login según la configuración
