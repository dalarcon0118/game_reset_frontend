# language: es

Característica: Especificación Técnica del Dashboard del Banquero
  Como Banquero del sistema
  Quiero que el Dashboard actúe como mi centro de mando operativo
  Para tomar decisiones basadas en datos reales de mi red de colectores

  Narrativa de Valor:
  El Dashboard es la pieza central de confianza. Si los datos aquí son incorrectos o el flujo se rompe, el banquero pierde visibilidad de su dinero y riesgo.

  Antecedentes:
    Dado que el sistema ha emitido la señal "SYSTEM_READY" con:
      | Atributo    | Valor             |
      | structureId | "BANCA-CENTRAL-01"|
      | userName    | "Juan Banquero"   |

  @testable @happy_path
  Escenario: Carga y visualización de métricas financieras (Mocks de API)
    Dado que el servidor devuelve el siguiente resumen para "BANCA-CENTRAL-01":
      | Recaudado | Utilidad | Comisiones | Riesgo   |
      | 1500.50   | 450.00   | 150.25     | "Bajo"   |
    Cuando el banquero aterriza en el Dashboard
    Entonces el componente con testID "user-info" debe mostrar "Juan Banquero"
    Y las tarjetas de métricas deben mostrar los valores exactos formateados:
      | Label      | Valor Esperado | testID            |
      | Recaudado  | "$1,500.50"    | "metric-collected"|
      | Utilidad   | "$450.00"      | "metric-profit"   |
      | Comisiones | "$150.25"      | "metric-commiss"  |

  @testable @list
  Escenario: Listado dinámico de Colectores (Hijos directos)
    Dado que la banca tiene los siguientes colectores asociados:
      | ID | Nombre       | Venta  | Estado   |
      | 1  | "Agencia-A"  | 500.00 | "Activo" |
      | 2  | "Agencia-B"  | 0.00   | "Inactivo"|
    Cuando visualizo la lista "collectors-list"
    Entonces debo ver 2 elementos de tipo "collector-card"
    Y el elemento "Agencia-A" debe mostrar un indicador verde de "Activo"
    Y el elemento "Agencia-B" debe mostrar un indicador gris de "Inactivo"

  @testable @navigation
  Escenario: Flujo de salto a detalle de colector
    Dado que estoy viendo la tarjeta del colector "Agencia-A"
    Cuando presiono el botón con testID "btn-view-sales-1"
    Entonces el sistema debe disparar el comando de navegación "NAVIGATE_TO_SALES"
    Y debe incluir el payload { "agencyId": 1 }

  @testable @empty_state
  Escenario: Visualización de banca sin colectores asignados
    Dado que el servidor devuelve una lista vacía de colectores
    Cuando carga el Dashboard
    Entonces no debe mostrarse la lista "collectors-list"
    Y debe mostrarse el componente "empty-collectors-view" con el texto "No tienes agencias asignadas aún"