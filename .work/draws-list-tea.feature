Feature: Draws list plugin TEA refactor

Scenario: Renderizar lista de sorteos desde el contexto
  Given el plugin de sorteos recibe un contexto con estado de draws y filteredDraws
  When la vista se renderiza
  Then muestra el encabezado con el conteo de sorteos
  And muestra la lista filtrada o un estado vacío si no hay sorteos

Scenario: Manejar estados de RemoteData en la vista
  Given draws está en estado NotAsked, Loading, Failure o Success
  When la vista se renderiza
  Then se muestra el estado correspondiente con el mismo contenido actual

Scenario: Publicar eventos de interacción
  Given el usuario interactúa con los controles del listado
  When dispara refresh o acciones sobre un sorteo
  Then se publican los mismos eventos actuales con los mismos payloads
