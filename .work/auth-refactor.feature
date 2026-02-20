Feature: Refactor Authentication Architecture
  Business value: 
    Enhance system stability by centralizing authentication logic in the AppKernel, 
    eliminating race conditions in navigation, and ensuring consistent state management via TEA.

  Scenario: Application Bootstrap and Auth Initialization
    Given the application starts
    And the AppKernel is configured with a real AuthProvider
    When the AuthContext initializes
    Then it should dispatch CHECK_AUTH_STATUS_REQUESTED to the TEA store
    And it should NOT perform any navigation logic directly
    And it should NOT manage the Splash Screen directly

  Scenario: Successful Login Flow
    Given the user is on the login screen
    When the user submits valid credentials
    Then the TEA store should receive a LOGIN_REQUESTED message
    And the Update function should call AppKernel.authProvider.login
    And upon success, the store should update isAuthenticated to true
    And useAuthNavigation should detect the state change and redirect to the dashboard

  Scenario: Session Expiration Handling
    Given the user is authenticated
    When the API returns a 401 Unauthorized error
    Then the configured API interceptor should trigger a LOGOUT_REQUESTED action
    And the TEA store should update isAuthenticated to false
    And useAuthNavigation should detect the state change and redirect to the login screen

  Scenario: Navigation Guarding
    Given the user is NOT authenticated
    When the user attempts to access a protected route
    Then useAuthNavigation should redirect the user to the login screen
    And the AuthContext should NOT interfere with this process
