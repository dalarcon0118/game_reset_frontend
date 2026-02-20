Feature: Optimización del AuthProvider para evitar re-renderizados

  Como desarrollador
  Quiero que el AuthProvider solo se renderice cuando cambien las propiedades relevantes (isAuthenticated, user, isLoading, error)
  Para mejorar el rendimiento de la aplicación y evitar ciclos innecesarios

  Scenario: Suscripción granular al estado de autenticación
    Given que el AuthStore puede recibir múltiples actualizaciones internas
    When el AuthProvider se suscribe al store
    Then debe usar una comparación superficial (shallow) o selectores individuales
    And solo debe re-renderizarse si 'isAuthenticated', 'user', 'isLoading' o 'error' cambian de valor o referencia significativa
    And no debe re-renderizarse por cambios en otras propiedades del modelo que no se exponen en el contexto

  Scenario: Comportamiento de inicialización
    Given que la aplicación inicia
    When el AuthProvider se monta
    Then debe despachar 'LOAD_SAVED_USERNAME_REQUESTED' y 'CHECK_AUTH_STATUS_REQUESTED' una sola vez
EOF~