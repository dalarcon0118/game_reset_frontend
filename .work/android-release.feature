Feature: Android Automatic Release
  As a developer
  I want the system to automatically create or update a GitHub Release
  So that the generated APK is easily accessible for users and testers from both tags and the main branch.

  Scenario: Automatically publish APK on tag push (Versioned Release)
    Given a commit is pushed with a tag matching "v*"
    When the "Android Build" workflow is triggered
    Then the workflow should build the release APK
    And the workflow should create a GitHub Release with the tag name
    And the workflow should upload the generated APK as an asset

  Scenario: Automatically update APK on push to main (Rolling Release)
    Given a commit is pushed to the "main" branch
    When the "Android Build" workflow is triggered
    Then the workflow should build the release APK
    And the workflow should update a GitHub Release tagged as "latest"
    And the workflow should replace the APK asset in the "latest" release
