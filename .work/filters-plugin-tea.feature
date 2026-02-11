Feature: Dashboard filters plugin TEA integration
  Scenario: User selects a dashboard filter tab
    Given the dashboard filters plugin is rendered
    When the user taps a filter option
    Then the selected filter state updates in the plugin model
    And the plugin publishes the "dashboard:filter_changed" event with the selected value
