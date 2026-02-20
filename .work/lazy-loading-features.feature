Feature: Lazy Loading de Funcionalidades por Rol

  Como usuario de la aplicación
  Quiero que solo se carguen las funcionalidades necesarias para mi rol
  Para ahorrar memoria y evitar conflictos de sincronización

  Scenario: Inicio de sesión como Listero carga features de apuestas
    Given que el usuario "Listero" ha iniciado sesión
    And que la aplicación ha arrancado sin features de apuestas
    When el usuario navega a la ruta "/lister"
    Then el sistema debe registrar el feature "BOLITA"
    And el sistema debe registrar el feature "LOTERIA"
    And el sistema debe registrar el feature "BET_WORKSPACE"
    And el sistema debe iniciar la sincronización de datos de apuestas

  Scenario: Inicio de sesión como Banquero NO carga features de apuestas
    Given que el usuario "Banquero" ha iniciado sesión
    And que la aplicación ha arrancado sin features de apuestas
    When el usuario navega a la ruta "/banker"
    Then el sistema NO debe registrar el feature "BOLITA"
    And el sistema NO debe registrar el feature "BET_WORKSPACE"

  Scenario: Sincronización inmediata al cargar Feature
    Given que el usuario ya está autenticado en el AuthStore
    When se registra el feature "ListeroDashboard"
    Then el feature debe detectar inmediatamente al usuario activo
    And debe disparar el evento "AUTH_USER_SYNCED" sin esperar cambios futuros
