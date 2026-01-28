Feature: Integración E2E de Notificaciones TEA
  Como usuario del sistema
  Quiero que mis notificaciones se sincronicen correctamente con el backend real
  Para asegurar la persistencia y consistencia de mis datos

  Scenario: Flujo completo de integración de notificaciones
    Given un usuario autenticado en el sistema
    And el sistema de notificaciones está inicializado
    When disparo una nueva notificación desde el backend para este usuario
    And despacho el comando "FETCH_NOTIFICATIONS_REQUESTED" en el store de TEA
    Then el estado de las notificaciones debe ser eventualmente "Success"
    And la lista de notificaciones debe contener la nueva notificación disparada
    When despacho el comando "MARK_AS_READ_REQUESTED" para la notificación recibida
    Then el estado local debe actualizarse a "read"
    And una nueva petición de lista debe confirmar que la notificación está "read" en el backend

  Scenario: Recepción de notificaciones en tiempo real vía SSE
    Given un usuario autenticado en el sistema
    And el sistema de notificaciones está suscrito al stream de eventos en tiempo real
    When disparo una nueva notificación desde el backend para este usuario
    Then la notificación debe aparecer automáticamente en el store de TEA sin refresco manual
    And el contador de notificaciones no leídas debe incrementarse automáticamente
