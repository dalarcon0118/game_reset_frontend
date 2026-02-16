Feature: Sincronización de Sorteos del Listero

  Como usuario listero autenticado
  Quiero que mis sorteos asignados se sincronicen automáticamente y se guarden localmente
  Para poder gestionar las apuestas incluso si pierdo la conexión a internet

  Scenario: Sincronización exitosa con el backend (Happy Path)
    Given el usuario "jose" está autenticado en el backend real
    When el sistema recibe la señal de "Usuario Sincronizado"
    Then el sistema debe solicitar los sorteos al backend
    And el sistema debe recibir una lista válida de sorteos
    And los sorteos deben guardarse en el almacenamiento local bajo la clave "@last_draws"
    And el modelo de la UI debe reflejar el estado de éxito

  Scenario: Manejo de error de red durante la sincronización (Sad Path)
    Given el usuario está autenticado
    And la conexión con el backend falla (error de red simulado)
    When el sistema intenta obtener los sorteos
    Then el sistema debe manejar el error y transicionar a un estado de fallo
    And el sistema NO debe sobrescribir el almacenamiento local con datos vacíos

  Scenario: Validación de integridad de datos (Data Integrity)
    Given el usuario recibe sorteos del backend
    When los datos son procesados
    Then cada sorteo debe tener un ID válido, nombre y estado
    And no se deben aceptar sorteos con estructuras corruptas
