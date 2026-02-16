Feature: Fix Navigation Mount Error
  As a user
  I want the application to navigate correctly even if the navigation system is still initializing
  So that I don't experience crashes or failed redirections on startup

  Scenario: Attempting to navigate before the Root Layout is mounted
    Given the TEA engine is initialized
    And a navigation command is triggered during app startup
    When the navigation system is not yet ready (navigationRef.isReady() is false)
    Then the navigation effect handler should wait for the system to be ready
    And it should retry the navigation until it succeeds or reaches a timeout
    And the user should be redirected to the correct destination once ready
