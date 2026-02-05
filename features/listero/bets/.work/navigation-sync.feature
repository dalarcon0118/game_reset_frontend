Feature: Navigation State Sync
  As a developer
  I want to sync the navigation object with the TEA store safely
  So that I avoid React lifecycle warnings and ensure stable event handling

  Scenario: Syncing navigation in entry screens
    Given the user is on an entry screen (Bolita or Loteria)
    When the navigation object changes or is initialized
    Then the navigation object should be dispatched to the store using useEffect
    And no React warning about "Cannot update a component while rendering a different component" should appear
