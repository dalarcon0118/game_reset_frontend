Feature: Fix Navigation Reference Warning

  Scenario: Synchronize navigation reference with Expo Router
    Given the application uses "expo-router" for navigation
    And a global "navigationRef" singleton is used for TEA architecture commands
    When the "RootLayout" component mounts
    Then it should use "useNavigationContainerRef" to obtain the real navigation container reference
    And it should synchronize this reference with the global "navigationRef"
    And it should NOT pass a "ref" prop directly to the "Stack" component to avoid the "Function components cannot be given refs" warning
