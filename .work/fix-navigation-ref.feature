Feature: Corrección de Navegación (Cmd.NAVIGATE)

  Scenario: Navegación exitosa usando Cmd.navigate
    Given que el sistema recibe un comando NAVIGATE
    When el payload contiene "pathname" (estándar de Cmd.navigate)
    Then el effectHandler debe extraer correctamente la ruta usando "pathname" o "path"
    And debe ejecutar la navegación a través de expo-router sin errores de "undefined"

  Scenario: Manejo de navegación "back"
    Given que el sistema recibe un comando NAVIGATE con method="back"
    Then el effectHandler debe ejecutar router.back() independientemente de si hay pathname
