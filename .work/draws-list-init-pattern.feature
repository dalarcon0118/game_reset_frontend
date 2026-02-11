Feature: Draws list init with ts-pattern

Scenario: Init runs when context is missing
  Given the draws list plugin has no context in its model
  When the component evaluates init conditions
  Then it calls init with the current context and config

Scenario: Init runs when host store changes
  Given the draws list plugin has a context with a different host store
  When the component evaluates init conditions
  Then it calls init with the current context and config

Scenario: Init runs when config changes
  Given the draws list plugin has a different config reference
  When the component evaluates init conditions
  Then it calls init with the current context and config

Scenario: Init does not run when context and config are stable
  Given the draws list plugin has the same host store and config
  When the component evaluates init conditions
  Then it does not call init
