Feature: BolitaKeyboardManager - Gestión Centralizada y Orquestación de Teclados
  Como desarrollador
  Quiero centralizar la UI y la orquestación de entrada de Bolita
  Para garantizar SRP (Single Responsibility) y SSOT (Single Source of Truth)

  Background:
    Given el sistema usa The Elm Architecture (TEA)
    And BolitaFlows orquestra las pulsaciones de teclas

  # --- ESCENARIOS POSITIVOS (HAPPY PATH) ---

  Scenario: Centralización de UI en Pantalla Principal
    When se renderiza BolitaEntryScreen
    Then no debe haber referencias directas a BetNumericKeyboard o AmountNumericKeyboard
    And debe incluir el componente BolitaKeyboardManager de forma declarativa

  Scenario: Mostrar teclado de apuestas correcto según el dueño
    When el estado activeOwner es 'fijos'
    And showBetKeyboard es true
    Then BolitaKeyboardManager debe renderizar BetNumericKeyboard
    And debe pasar el betType BET_TYPE_KEYS.FIJO_CORRIDO

  Scenario: Orquestación SSOT de Confirmación
    Given un teclado numérico está abierto con activeOwner='parlet'
    When el usuario presiona "Confirmar" (OK)
    Then el teclado debe despachar únicamente KEY_PRESSED({ key: 'confirm' })
    And BolitaFlows debe interceptar y despachar PARLET(PARLET_CONFIRM_INPUT())

  Scenario: Cierre contextual automático del teclado
    Given el teclado de apuestas de 'centena' está visible
    When el usuario cierra el BottomDrawer (onClose)
    Then se debe disparar el mensaje CENTENA(CLOSE_CENTENA_BET_KEYBOARD())
    And el teclado debe ocultarse limpiando el estado de edición

  Scenario: Abstracción de Teclados en Hooks (useFijos, useParlet, useCentena)
    When un hook de presentación necesita cerrar el teclado
    Then no debe despachar mensajes específicos de categoría (ej. CLOSE_PARLET_BET_KEYBOARD)
    And debe usar un mensaje genérico de cierre o delegar al BolitaKeyboardManager

  # --- ESCENARIOS NEGATIVOS (EDGE CASES & ERROR HANDLING) ---

  Scenario: Intento de renderizado sin dueño activo (activeOwner: null)
    Given el estado activeOwner es null
    And showBetKeyboard es true
    Then BolitaKeyboardManager no debe renderizar ningún teclado (retornar null)
    And debe registrar un log de advertencia para depuración

  Scenario: Cambio rápido de contexto entre categorías
    Given el teclado está abierto para activeOwner='fijos'
    When el usuario hace clic rápidamente en la columna 'parlet'
    Then el estado activeOwner debe actualizarse a 'parlet' antes de renderizar
    And el Manager debe destruir el teclado anterior y montar el nuevo de Parlet
    And el currentInput debe reiniciarse para evitar arrastrar números de Fijos

  Scenario: Confirmación con entrada inválida o vacía
    Given el teclado está abierto y currentInput es ""
    When el usuario presiona "Confirmar"
    Then BolitaFlows debe interceptar el mensaje KEY_PRESSED
    And debe ignorar la confirmación si la lógica de negocio del activeOwner lo requiere
    And no debe disparar mensajes de confirmación de sub-update (ej. FIJOS_CONFIRM_INPUT)

  Scenario: Cierre de teclado durante una transición de estado de guardado
    Given el sistema está en estado isSaving=true
    When el usuario intenta cerrar el teclado
    Then el BolitaKeyboardManager debe permitir el cierre visual
    And no debe interferir con el proceso de guardado asíncrono en curso

  # --- REGLAS TÉCNICAS (CONTRATO DE IMPLEMENTACIÓN) ---

  Rule: Mapeo Exhaustivo de Mensajes de Cierre
    | activeOwner | Teclado Activo | Mensaje de Cierre (onClose) |
    | :--- | :--- | :--- |
    | fijos | showBetKeyboard | FIJOS(CLOSE_BET_KEYBOARD()) |
    | fijos | showAmountKeyboard | FIJOS(CLOSE_AMOUNT_KEYBOARD()) |
    | parlet | showBetKeyboard | PARLET(CLOSE_PARLET_BET_KEYBOARD()) |
    | parlet | showAmountKeyboard | PARLET(CLOSE_PARLET_AMOUNT_KEYBOARD()) |
    | centena | showBetKeyboard | CENTENA(CLOSE_CENTENA_BET_KEYBOARD()) |
    | centena | showAmountKeyboard | CENTENA(CLOSE_CENTENA_AMOUNT_KEYBOARD()) |

  Rule: Interfaz de Entrada Unificada (SSOT)
    - Los teclados numéricos SOLO emiten KEY_PRESSED.
    - Se prohíbe el paso de callbacks de confirmación específicos (onConfirm) desde la UI.

  Rule: Limpieza de Hooks de Presentación
    - Los hooks useFijos, useParlet y useCentena deben ser "Read-Only" para el estado del teclado.
    - No deben contener lógica de "cómo cerrar" o "cómo procesar teclas".
    - Deben eliminarse: handleKeyPress, handleConfirmInput, hideBetKeyboard, hideAmountKeyboard de los hooks.
