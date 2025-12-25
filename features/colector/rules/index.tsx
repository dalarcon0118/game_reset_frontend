
import React from 'react';
import { StyleSheet, View, FlatList, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useRules, Rule } from './hook/hook.rule';
import { Flex, Label, Card } from '@/shared/components';
import { useTheme } from '@/shared/hooks/useTheme';

function Lista() {
  const { rules, toggleRule } = useRules();

  const renderItem = ({ item }: { item: Rule }) => (
    <Card style={styles.ruleCard}>
      <View style={styles.ruleRow}>
        <View style={styles.ruleInfo}>
          <Label type="header" style={styles.ruleName} value={item.name} />
          <Label type="detail" style={styles.ruleDescription} value={item.description} />
        </View>
        <View style={styles.toggleContainer}>
          <Switch
            value={item.isActive}
            onValueChange={() => toggleRule(item.id)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={item.isActive ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
      </View>
    </Card>
  );

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
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Flex flex={1} background={colors.background}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Flex align="center" gap={16} padding={16} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Label type="title" value="Reglamento" />
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
    justifyContent: 'center',
  },
});
