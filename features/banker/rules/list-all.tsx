import React from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity } from 'react-native';
import { Toggle } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { useRuleStore, selectRules, selectDispatch } from './store';
import { Flex, Label, Card } from '@/shared/components';
import { useTheme } from '@/shared/hooks/useTheme';
import { ROUTER_BACK, ROUTER_GO, Rule, TOGGLE_RULE_REQUESTED } from './store/types';

function Lista() {
  const dispatch = useRuleStore(state => state.dispatch);
  const rules = useRuleStore(selectRules);
  const { colors } = useTheme();

  const renderItem = ({ item }: { item: Rule }) => (
    <Card style={styles.ruleCard}>
      <View style={styles.ruleRow}>
        <View style={styles.ruleInfo}>
          <Label type="header" style={styles.ruleName} value={item.name} />
          <Label type="detail" style={styles.ruleDescription} value={item.description} />
        </View>
        <View style={styles.toggleContainer}>
          <Label
            type="detail"
            style={[
              styles.typeLabel,
              { color: item.ruleType === 'validation' ? colors.primary : colors.secondary }
            ]}
            value={item.ruleType.toUpperCase()}
          />
          <Toggle
            checked={item.isActive}
            onChange={() => dispatch(TOGGLE_RULE_REQUESTED(item.id, item.ruleType))}
            status={item.ruleType === 'validation' ? 'primary' : 'success'}
          />
          <Label
            type="detail"
            style={[
              styles.toggleLabel,
              { color: item.isActive ? colors.primary : colors.textSecondary }
            ]}
            value={item.isActive ? 'ON' : 'OFF'}
          />
        </View>
      </View>
    </Card>
  );

  React.useEffect(() => {
    dispatch({ type: 'FETCH_RULES_REQUESTED' });
  }, []);

  return (
    <FlatList
      data={rules}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContainer}
    />
  );
}

export default function RulesScreen() {
  const dispatch = useRuleStore(selectDispatch);
  const { colors } = useTheme();

  return (
    <Flex flex={1} background={colors.background}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Flex align="center" gap={16} padding={16} style={styles.header}>
          <TouchableOpacity onPress={() => dispatch(ROUTER_BACK())}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Label type="title" value="Regla del banquero" />
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => dispatch(ROUTER_GO('/banker/rules/update'))}
          >
            <Plus size={24} color={colors.primary} />
          </TouchableOpacity>
        </Flex>
        <Lista />
      </SafeAreaView>
    </Flex>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  addButton: {
    marginLeft: 'auto',
    padding: 8,
    borderRadius: 8,
  },
  title: {
    textAlign: 'center',
    marginVertical: 20,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  ruleCard: {
    marginVertical: 8,
    borderRadius: 8,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  ruleInfo: {
    flex: 1,
    marginRight: 16,
  },
  ruleName: {
    marginBottom: 4,
  },
  ruleDescription: {
    color: '#8F9BB3',
  },
  toggleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  toggleWrapper: {
    alignItems: 'center',
    gap: 8,
  },
  toggleButtonContainer: {
    alignItems: 'center',
    gap: 4,
  },
  toggleButton: {
    width: 44,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleKnob: {
    width: 16,
    height: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
