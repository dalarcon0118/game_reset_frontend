Feature: Plugin initialization and TEA subscriptions without useEffect

Scenario: Filters plugin initializes from host context
  Given the filters plugin receives a context and config from the host
  When the plugin store initializes with those parameters
  Then the plugin model uses the host status filter or the default value

Scenario: Filters plugin syncs status filter from host store
  Given the filters plugin is initialized with a host store
  When the host store status filter changes
  Then the plugin updates its status filter through a subscription message

Scenario: Draws list plugin initializes from host context
  Given the draws list plugin receives a context and config from the host
  When the plugin store initializes with those parameters
  Then the plugin model stores the context and config

Scenario: Draws list plugin syncs draws and filter from host store
  Given the draws list plugin is initialized with a host store
  When the host store draws or status filter changes
  Then the plugin updates its model via a subscription message
