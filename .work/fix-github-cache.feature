Feature: Fix GitHub Actions Dependency Cache
  As a developer
  I want the CI pipeline to correctly cache npm dependencies
  So that build times are reduced and caching errors are eliminated

  Scenario: Enable npm caching in setup-node step
    Given a GitHub Actions workflow file exists at ".github/workflows/android-build.yml"
    And a "package-lock.json" file exists in the project root
    When the "actions/setup-node@v4" step is executed
    Then it should include the "cache: 'npm'" configuration
    And the dependency installation should use "npm ci"
