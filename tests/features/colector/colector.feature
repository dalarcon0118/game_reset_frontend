Feature: Casos de Uso del Colector
  Como colector del sistema
  Quiero supervisar la estructura de listeros y su estado financiero
  Para gestionar eficientemente mi red de ventas.

  Background:
    Given que el servidor de backend está disponible

  Scenario: Autenticación exitosa como colector
    When intento iniciar sesión con usuario "colector_test" y contraseña "password123"
    Then la autenticación debe ser exitosa
    And el rol del usuario debe ser "colector"

  Scenario: Cargar resumen del estado financiero del colector
    Given que estoy autenticado como "colector"
    When solicito mi resumen financiero
    Then debo ver el total recolectado, comisiones y balance neto de mi estructura

  Scenario: Gestionar estructura de listeros hijos
    Given que estoy autenticado como "colector"
    When cargo los nodos hijos de mi estructura
    Then debo ver una lista de listeros con su resumen financiero individual
    And puedo listar el detalle de operaciones de cada hijo seleccionado
