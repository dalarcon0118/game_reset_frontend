import React from 'react';
import { StyleSheet, View, FlatList, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { useRuleStore, selectRules, selectDispatch } from './store';
import { Flex, Label, Card } from '@/shared/components';
import { useTheme } from '@/shared/hooks/useTheme';
import { ROUTER_BACK, ROUTER_GO, Rule, TOGGLE_RULE_REQUESTED } from './store/types';



// Also export named exports for other components
export { useRules } from './hook/hook.rule';
export { default as BankerRulesListScreen } from './list-all';
export { default as BankerRuleUpdateScreen } from './update';
