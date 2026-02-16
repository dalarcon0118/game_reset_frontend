Feature: Fix Development Server Hang
  As a developer
  I want the development server to start reliably
  So that I don't get stuck with occupied ports or missing polyfills

  Scenario: Clean start of the development server
    Given the development server is not running
    And port 8081 might be occupied by a zombie process
    When I run "npm start"
    Then the system should identify and kill any process on port 8081
    And it should start the Metro Bundler successfully
    And it should pipe logs to both the console and "frontend/logs/frontend.log"

  Scenario: Automatic Polyfill for ReadableStream
    Given I am running on a Node.js version that lacks ReadableStream
    When I start the development server
    Then the "start-dev.js" script should apply the "web-streams-polyfill"
    And it should launch Expo without "ReferenceError: ReadableStream is not defined"
