Feature: Fix Render Timeout and Retry Logic

  As a user
  I want the application to wait longer for the server to respond
  So that I don't see error messages when the server is waking up from sleep

  Scenario: Increase API Timeout for Cold Starts
    Given the backend is hosted on Render Free Tier
    And the server might be in a sleeping state
    When the client makes an API request
    Then the timeout should be at least 60 seconds to allow for cold starts
    And the request should not be aborted prematurely

  Scenario: Retry on AbortError
    Given a request is aborted due to a timeout
    When the error is classified as an AbortError
    Then the client should consider retrying the request if it is idempotent
    And the user should eventually see the data instead of an error
