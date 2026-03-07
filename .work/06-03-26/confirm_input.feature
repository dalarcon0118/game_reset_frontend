Feature: Keyboard Input Confirmation in Bolita
  As a Listero
  I want to confirm my keyboard inputs (numbers and amounts)
  So that I can add bets and update amounts efficiently

  Background:
    Given the Bolita feature is active
    And I am in the "Fijos" tab

  Scenario: Confirming a Fijo number selection
    Given I have the bet keyboard open for "fijos"
    And the current input is "1234"
    When I press the "CONFIRM" key (FIJOS_CONFIRM_INPUT)
    Then the system should parse "1234" into numbers [12, 34]
    And two new "fijos" bets should be added to the list
    And the bet keyboard should be closed
    And the summary should be recalculated

  Scenario: Confirming a Fijo amount update
    Given I have the amount keyboard open for a "fijos" bet with ID "bet-1"
    And the amount type is "fijo"
    And the current input is "50"
    When I press the "CONFIRM" key (FIJOS_CONFIRM_INPUT)
    Then the "fijoAmount" of bet "bet-1" should be updated to 50
    And the amount keyboard should be closed
    And the summary should be recalculated

  Scenario: Confirming a Parlet amount update
    Given I have the amount keyboard open for a "parlet" bet with ID "parlet-1"
    And the current input is "100"
    When I press the "CONFIRM" key (PARLET_CONFIRM_INPUT)
    Then the "amount" of parlet "parlet-1" should be updated to 100
    And the amount keyboard should be closed
    And the summary should be recalculated

  Scenario: Confirming a Centena amount update
    Given I have the amount keyboard open for a "centena" bet with ID "centena-1"
    And the current input is "200"
    When I press the "CONFIRM" key (CENTENA_CONFIRM_INPUT)
    Then the "amount" of centena "centena-1" should be updated to 200
    And the amount keyboard should be closed
    And the summary should be recalculated
