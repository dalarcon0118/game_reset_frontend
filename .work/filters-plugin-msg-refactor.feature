Feature: Refactor filters plugin messages

Scenario: Align filters plugin msg definitions with summary plugin style
  Given the filters plugin defines its messages in msg.ts
  When the file is refactored using the summary plugin msg.ts as reference
  Then the message constants and Msg union follow the same structure and ordering conventions
