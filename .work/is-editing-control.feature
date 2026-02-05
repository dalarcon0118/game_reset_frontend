Feature: Control redundant bet fetching between entry and list screens

  Scenario: User enters the bet entry screen
    Given the user is in the "LoteriaEntryScreen"
    When the screen is focused
    Then the system sets "isEditing" to true in the model
    And the system should NOT fetch bets from the server

  Scenario: User enters the bet list screen
    Given the user is in the "LoteriaListPlays" or "BolitaListPlays"
    When the screen is focused
    Then the system sets "isEditing" to false in the model
    And the system should fetch bets from the server
