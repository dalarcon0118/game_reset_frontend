Feature: Mejora visual del header del dashboard
  Scenario: Jerarquía y balance del header
    Given que el usuario está en el dashboard del listero
    When se renderiza el header superior
    Then el saludo y el nombre del usuario tienen una jerarquía clara
    And la marca no domina visualmente el bloque
    And los iconos de acción mantienen tamaño y estilo consistentes
    And el espaciado vertical mejora la legibilidad del header
