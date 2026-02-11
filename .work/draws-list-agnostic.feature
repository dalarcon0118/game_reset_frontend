Feature: Dashboard Draws List Agnostic Plugin
  As a developer
  I want the Draws List plugin to be agnostic of the host context
  So that I can reuse it in different dashboards by providing a configuration

  Scenario: Plugin uses configuration for state keys and events
    Given a host context with specific state keys for draws
    And a configuration mapping those keys and events
    When the plugin is initialized with the configuration
    Then it should read the draws from the configured state keys
    And it should publish events using the configured event names
