import React from 'react';
import { View,StyleSheet } from 'react-native';
import { Card, Text } from '@ui-kitten/components';

interface RuleItemProps {
  label: string;
  value: string | number;
}

interface RuleCardProps {
  title: string;
  rules: RuleItemProps[];
}

export function RuleItem({ label, value }: RuleItemProps) {
  return (
    <View style={styles.ruleItem}>
      <Text style={styles.ruleLabel}>{label}:</Text>
      <Text style={styles.ruleValue}>{value}</Text>
    </View>
  );
}

export default function RuleCard({ title, rules }: RuleCardProps) {
  return (
    <Card style={styles.card}>
      <Text category="h6" style={styles.cardTitle}>
        {title}
      </Text>
      {rules.map((rule, index) => (
        <RuleItem key={index} label={rule.label} value={rule.value} />
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 8,
  },
  cardTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  ruleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  ruleLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  ruleValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});