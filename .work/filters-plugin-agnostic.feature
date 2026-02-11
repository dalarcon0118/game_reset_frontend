Feature: Filters plugin agnostic configuration
  Scenario: Plugin uses configurable state key and event name
    Given the filters plugin receives a configuration with stateKey and eventName
    When the user selects a filter option
    Then the plugin reads the host state using the configured stateKey
    And the plugin publishes the configured eventName with the selected value
