Feature: Guardia de Renderizado por Autenticación
  Como desarrollador del sistema
  Quiero que la aplicación solo renderice componentes hijos cuando la sesión sea válida
  Para evitar peticiones no autorizadas y mejorar la seguridad del cliente

  Scenario: Bloqueo de renderizado durante la carga inicial
    Given que el estado de autenticación en TEA es "Loading"
    When la aplicación se inicia
    Then el AuthProvider debe mostrar una pantalla de carga (Splash)
    And los componentes hijos del Stack de navegación no deben montarse

  Scenario: Redirección automática al login si no hay sesión
    Given que el estado de autenticación en TEA es "NotAuthenticated"
    And el usuario intenta acceder a una ruta privada
    When el AuthProvider detecta la falta de sesión
    Then la aplicación debe redirigir automáticamente a la pantalla de "/login"
    And los componentes de la ruta privada no deben ejecutarse

  Scenario: Renderizado exitoso con sesión válida
    Given que el estado de autenticación en TEA es "Authenticated"
    When el usuario accede a una ruta protegida
    Then el AuthProvider debe permitir el renderizado de los componentes hijos
    And las peticiones a la API deben incluir el token de autenticación válido
