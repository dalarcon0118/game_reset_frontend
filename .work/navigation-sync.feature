Feature: Sincronización de Modo Edición mediante Suscripciones de Navegación

  Como desarrollador
  Quiero que el estado isEditing se sincronice automáticamente con la navegación
  Para eliminar la lógica imperativa (useEffect) en los componentes de UI y seguir el patrón TEA.

  Scenario: Sincronización automática al inyectar navegación
    Given el modelo no tiene objeto de navegación inyectado
    When se inyecta el objeto de navegación desde una pantalla de entrada (e.g. "loteria_entry")
    Then el modelo debe actualizar el objeto de navegación
    And el estado isEditing debe cambiar automáticamente a true
    And no se deben realizar peticiones de carga de apuestas

  Scenario: Cambio de modo al navegar a un listado
    Given el modelo tiene el estado isEditing en true
    When la ruta de navegación cambia a un listado (e.g. "loteria_list_plays")
    Then la suscripción watchStore debe detectar el cambio de ruta
    And debe disparar un mensaje SET_IS_EDITING con isEditing en false
    And el modelo debe actualizar isEditing a false
    And se deben disparar los comandos de carga de apuestas correspondientes

  Scenario: Navegación interna entre pantallas de entrada
    Given el modelo tiene el estado isEditing en true
    When la ruta de navegación cambia de "bolita_entry" a "loteria_entry"
    Then el estado isEditing debe permanecer en true
    And no se deben disparar peticiones redundantes de carga de apuestas
