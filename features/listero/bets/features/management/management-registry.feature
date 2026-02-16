Feature: Management Module Decoupling via Registry

  Scenario: Management module prepares data for saving without knowing domain specifics
    Given the "Parlet" feature is registered in the BetRegistry
    And the global model contains "Parlet" bets in the "entrySession"
    When the management module requests data preparation for saving
    Then the "Parlet" feature should process its own bets (calculating totals)
    And the management module should receive a unified data object containing the processed Parlet bets
    And the management module should NOT directly reference "ParletDomain" logic

  Scenario: Management module identifies bet types using registered features
    Given multiple features are registered (e.g., "Parlet", "Standard")
    And a list of available GameTypes is fetched from the backend
    When the management module needs to identify bet types
    Then it should delegate identification to the BetRegistry
    And each registered feature should identify its corresponding GameType IDs
    And the result should be a map of identified bet types

  Scenario: Management module resets bets using registered features
    Given the user requests to reset all bets
    When the management module processes the reset action
    Then it should ask the BetRegistry for the empty state of all features
    And the resulting state should contain empty arrays for all registered bet types
