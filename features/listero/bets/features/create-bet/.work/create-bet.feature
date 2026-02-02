Feature: Listero Create Bet Screen
  As a Listero
  I want to record player bets for active draws
  So that I can manage the betting process efficiently

  Background:
    Given I am logged in as a Listero
    And there is an active draw available for betting

  Scenario: Initializing the Create Bet Screen
    When I navigate to the Create Bet Screen for an active draw
    Then I should see the draw name in the header
    And I should see the available game types (Fijo, Corrido, Parlet, Centena)
    And the numeric keyboard should be visible
    And the "Anotar" button should be disabled until a valid bet is entered

  Scenario: Entering a simple bet (Fijo)
    Given I have selected the "Fijo" game type
    When I enter the number "45"
    And I enter an amount of "10"
    Then I should see the bet details in the summary section
    And the "ANOTAR MÁS+" button should be enabled

  Scenario: Adding multiple bets to a session
    Given I have entered a "Fijo" bet for "45" with amount "10"
    And I press "ANOTAR MÁS+"
    When I enter a "Parlet" bet for "45-90" with amount "5"
    And I press "ANOTAR MÁS+"
    Then the summary list should show 2 bets
    And the total session amount should be "15"

  Scenario: Submitting the betting session
    Given I have 2 bets in the summary list
    When I press "REGISTRAR APUESTAS"
    Then the bets should be sent to the backend
    And I should see a success confirmation
    And I should be navigated back to the draw list or dashboard

  Scenario: Validating invalid numbers
    Given I have selected the "Fijo" game type
    When I enter the number "123" (more than 2 digits)
    Then I should see a validation error
    And I should not be able to add the bet to the summary

  Scenario: Clearing the session
    Given I have 2 bets in the summary list
    When I press the "Limpiar" button
    Then the summary list should be empty
    And all input fields should be reset
