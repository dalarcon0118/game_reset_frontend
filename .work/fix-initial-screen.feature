Feature: Corregir pantalla inicial en blanco

  Como usuario de la aplicación
  Quiero ser redirigido automáticamente al login si no tengo sesión
  Para evitar ver una pantalla en blanco al iniciar la aplicación

  Scenario: Redirección automática al login cuando no hay sesión
    Given que la aplicación se está iniciando
    And el usuario no está autenticado
    And el estado de carga de autenticación ha finalizado
    When el usuario se encuentra en la ruta raíz "/"
    Then la aplicación debe redirigir automáticamente a la pantalla de "/login"

  Scenario: Evitar bloqueo de pantalla por carga infinita
    Given que el servidor backend no responde (ping fallido)
    And el AuthProvider está intentando verificar la sesión
    When se alcanza el timeout de seguridad o falla la petición
    Then el AuthProvider debe dejar de mostrar el splash screen inicial
    And permitir que el sistema de navegación muestre la pantalla de login