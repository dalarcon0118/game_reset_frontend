Feature: Pre-build Dependency Verification
  As a developer
  I want a pre-build step to verify all code imports against package.json
  So that missing dependencies are caught early and build stability is improved

  Scenario: Detect missing dependency in code
    Given a source file uses an external library (e.g., "ts-pattern")
    And the library is NOT listed in "package.json"
    When the "node scripts/check-deps.js" script is executed
    Then the script should exit with an error code (1)
    And it should list the missing dependency and the files using it

  Scenario: Successful build with all dependencies present
    Given all external libraries imported in the code are listed in "package.json"
    When the "node scripts/check-deps.js" script is executed
    Then the script should exit successfully (0)
    And it should confirm that all dependencies are correctly resolved

  Scenario: Integrate verification in CI pipeline
    Given the GitHub Actions workflow "android-build.yml"
    When a build is triggered
    Then the dependency verification step should run before the Android build
    And if the verification fails, the pipeline should stop immediately
