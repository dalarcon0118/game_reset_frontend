Feature: Fix DrawApi Undefined Error and Enhance Diagnostics

  Scenario: Detect undefined apiClient in DrawApi
    Given the application is running
    And the DrawApi module is loaded
    When DrawApi.list is called
    Then it should verify that apiClient is defined
    And if apiClient is undefined, it should throw a descriptive error "DrawApi Error: apiClient is undefined"

  Scenario: Log detailed task execution failures
    Given a TEA task is executing via task.effect.ts
    When the task execution fails
    Then the error logger should capture the error
    And the log should include the first 100 characters of the task source code
    And the log should include the arguments passed to the task

  Scenario: Prevent Plugin API access without bootstrapped Kernel
    Given the PluginRegistry is creating a plugin context
    When the plugin attempts to use api.get or api.post
    Then it should verify that AppKernel.dataProvider is initialized
    And if dataProvider is missing, it should throw a specific error "Plugin API Error: AppKernel.dataProvider is not initialized"
