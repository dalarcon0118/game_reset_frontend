Feature: Plugins manage business logic and state

  Scenario: Summary plugin loads and computes its own totals
    Given the dashboard summary plugin is initialized
    When the plugin loads summary data
    Then the plugin computes daily totals internally
    And the host does not provide daily totals directly

  Scenario: Draws list plugin manages its own data
    Given the draws list plugin is initialized
    When the plugin fetches draws data
    Then the plugin renders draws from its own state

  Scenario: Filters plugin manages its own selection
    Given the filters plugin is initialized
    When the user changes the filter
    Then the plugin updates its internal filter state
    And publishes a filter change event
