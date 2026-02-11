Feature: Update filters plugin match by _type

Scenario: Use _type constants in update matcher
  Given the filters plugin update function matches on message types
  When the match cases are updated to use Msg constants _type
  Then the update logic uses consistent message type matching
