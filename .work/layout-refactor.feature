Feature: Root Layout Refactoring
  As a developer
  I want to refactor the root layout using composition and custom hooks
  So that the codebase is more maintainable, testable, and follows the Single Responsibility Principle

  Scenario: Application Initialization
    Given the application is starting
    When the root layout mounts
    Then global side effects (polyfills, error handlers) should be initialized first
    And the splash screen should be visible
    And the application architecture should be bootstrapped via "useAppBootstrap" hook
    And the "AppProviders" component should wrap the application with all necessary contexts

  Scenario: Authentication and Navigation
    Given the application architecture is ready
    When the auth state changes
    Then the "useAuthNavigation" hook should handle redirection logic
    And authenticated users on public pages should be redirected to their dashboard
    And unauthenticated users on protected pages should be redirected to login
    And the splash screen should be hidden only after auth loading is complete

  Scenario: Error Handling
    Given a fatal error occurs during rendering
    When the error boundary catches the error
    Then the "GlobalErrorBoundary" component should display a user-friendly error message
    And the error should be logged to the console
