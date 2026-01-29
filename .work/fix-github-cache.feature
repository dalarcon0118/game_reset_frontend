Feature: Fix GitHub Actions Dependency Cache, Gradle Stability, and Runtime Dependencies
  As a developer
  I want the CI pipeline to correctly cache dependencies, provide stable builds, and ensure all runtime dependencies are available
  So that build times are reduced and the application builds successfully without missing modules

  Scenario: Enable npm caching with explicit path
    Given a GitHub Actions workflow file exists at ".github/workflows/android-build.yml"
    And a "package-lock.json" file exists in the project root
    When the "actions/setup-node@v4" step is executed
    Then it should include the "cache: 'npm'" configuration
    And it should include "cache-dependency-path: package-lock.json"

  Scenario: Enable gradle caching with explicit path
    Given a GitHub Actions workflow file exists at ".github/workflows/android-build.yml"
    And gradle files exist in the "android/" directory
    When the "actions/setup-java@v4" step is executed
    Then it should include the "cache: 'gradle'" configuration
    And it should include "cache-dependency-path: android/**/*.gradle*"

  Scenario: Improve Gradle build stability and diagnostics
    Given a GitHub Actions workflow file exists at ".github/workflows/android-build.yml"
    When the "Build Android APK" step is executed
    Then it should use "--info" and "--full-stacktrace" for detailed error reporting
    And the JVM memory should be tuned to "-Xmx4096m" to avoid OOM on standard runners

  Scenario: Ensure missing runtime dependencies are installed
    Given the source code uses "ts-pattern" for pattern matching in "edit_list_screen.tsx"
    And "ts-pattern" is missing from "package.json"
    When the dependency is installed via "npm install ts-pattern"
    Then the module should be resolvable during the Metro bundling process
