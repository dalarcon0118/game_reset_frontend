Feature: AppKernel Feature and Plugin Registration
  In order to decouple the application architecture and support scalable feature development
  As a System Architect
  I want a Kernel that supports dynamic registration of Features and Plugins with optional adapters

  Scenario: Registering a Simple Feature (No Adapter)
    Given the AppKernel is initialized
    And I have a simple feature "Auth" with an init and update function
    When I register the feature "Auth" into the Kernel
    Then the Kernel should store the feature in its registry
    And the feature should be accessible by its ID "Auth"
    And the Kernel should use the feature's default update logic when processing messages for "Auth"

  Scenario: Registering a Feature with an Adapter
    Given the AppKernel is initialized
    And I have a complex feature "Betting" that requires an adapter
    And I define a "BettingAdapter" that transforms global messages to feature-specific messages
    When I register the feature "Betting" with the adapter
    Then the Kernel should store the feature and its adapter
    And when the Kernel receives a global message for "Betting", it should use the adapter to transform it
    And the transformed message should be passed to the feature's update function

  Scenario: Registering a Global Plugin
    Given the AppKernel is initialized
    And I have a "LoggerPlugin" that logs every message
    When I register the plugin "LoggerPlugin"
    Then the Kernel should add it to the plugin chain
    And the plugin should be executed on every message processed by the Kernel
