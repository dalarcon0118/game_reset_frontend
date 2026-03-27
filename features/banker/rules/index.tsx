import React from 'react';
import { BankerRulesStoreProvider } from './core';
import RulesListScreen from './presentation/screens/rules_list_screen';
import RuleUpdateScreen from './presentation/screens/rule_update_screen';

/**
 * 🚀 BANKER RULES FEATURE ENTRY POINT
 */

export default function BankerRules() {
  return (
    <BankerRulesStoreProvider>
      <RulesListScreen />
    </BankerRulesStoreProvider>
  );
}

// Named exports for routing or other usages
export const BankerRulesList = () => (
  <BankerRulesStoreProvider>
    <RulesListScreen />
  </BankerRulesStoreProvider>
);

export const BankerRuleUpdate = () => (
  <BankerRulesStoreProvider>
    <RuleUpdateScreen />
  </BankerRulesStoreProvider>
);

export { RulesListScreen, RuleUpdateScreen };
