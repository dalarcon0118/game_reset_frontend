Feature: Casos de Uso del Listero
  Como listero del sistema
  Quiero autenticarme y gestionar mis sorteos y apuestas
  Para mantener el control financiero de mis operaciones.

  Background:
    Given que el servidor de backend está disponible

  Scenario: Autenticación exitosa como listero
    When intento iniciar sesión con usuario "listero_test" y contraseña "password123"
    Then la autenticación debe ser exitosa
    And el rol del usuario debe ser "listero"

  Scenario: Listar información financiera del listero
    Given que estoy autenticado como "listero"
    When solicito mi resumen financiero
    Then debo ver el balance total, ventas del día y comisiones acumuladas

  Scenario: Gestionar sorteos abiertos y apuestas
    Given que estoy autenticado como "listero"
    When listo los sorteos abiertos
    Then debo ver una lista de sorteos con su estado financiero individual
    When selecciono un sorteo para anotar una apuesta de 100 DOP al número "25"
    Then la apuesta debe registrarse exitosamente
    And la lista de apuestas del sorteo debe incluir la nueva apuesta

  Scenario: Verificar cumplimiento de reglas
    Given que estoy autenticado como "listero"
    And las reglas de apuesta están configuradas
    When intento realizar una apuesta que excede el límite permitido
    Then el sistema debe rechazar la apuesta por incumplimiento de reglas
    And debe mostrarse el mensaje de error correspondiente
