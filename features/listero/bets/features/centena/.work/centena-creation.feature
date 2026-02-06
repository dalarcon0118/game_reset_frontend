Feature: Centena Bet Creation and Amount Association
  As a user
  I want to create centena bets and associate amounts to them
  So that I can manage my centena bets correctly

  Scenario: Creating a new centena bet and adding an amount
    Given I am in the centena creation screen
    When I enter a 3-digit number "123"
    And I confirm the number
    Then a new centena bet with number "123" should be created
    And the amount keyboard should open automatically for that bet
    And the editing context should be "centena"

  Scenario: Confirming an amount for a centena bet
    Given a centena bet exists with number "123" and amount 0
    And the amount keyboard is open for that bet
    When I enter an amount "50"
    And I confirm the amount
    Then the centena bet should have the amount "50"
    And the amount keyboard should close
    And the dispatch message should be of type "CENTENA"

  Scenario: Editing an existing centena bet number
    Given a centena bet exists with id "abc" and number "123"
    When I press the bet circle for "123"
    And I enter a new number "456"
    And I confirm the number
    Then the centena bet with id "abc" should now have number "456"
    And the amount keyboard should NOT open automatically (since it's an edit of number only)
