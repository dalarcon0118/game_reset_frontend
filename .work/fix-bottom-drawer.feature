Feature: Fix BottomDrawer naming convention
  As a developer
  I want to rename bottom_drawer to BottomDrawer
  So that React can correctly identify it as a component and avoid Invariant Violation errors

  Scenario: Rename component and hook
    Given the component "bottom_drawer" is defined in lowercase
    And the hook "use_bottom_drawer" is defined in lowercase
    When I rename the component to "BottomDrawer"
    And I rename the hook to "useBottomDrawer"
    Then the "Invariant Violation" error should be resolved
    And all imports should be updated to use the new names
