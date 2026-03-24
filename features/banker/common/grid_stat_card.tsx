import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '@ui-kitten/components';
import { Card } from '@/shared/components/card';
import { Flex } from '@/shared/components/flex';
import { Label } from '@/shared/components/label';

interface GridStatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  barColor: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const GridStatCard: React.FC<GridStatCardProps> = ({ label, value, icon, barColor, children, style }) => {
  const theme = useTheme();

  return (
    <Card
      testID={`stat-card-${label.toLowerCase().replace(/\s+/g, '-')}`}
      style={[
        styles.container, 
        { backgroundColor: theme['background-basic-color-1'] },
        style
      ]}
      padding={0}
    >
      <View style={[styles.topBar, { backgroundColor: barColor }]} />

      <Flex
        justify="between"
        align="center"
        padding={[{ type: 'horizontal', value: 16 }, { type: 'vertical', value: 16 }]}
      >
        <Flex vertical gap={4}>
          <Label type="detail" style={[styles.label, { color: theme['text-hint-color'] }]}>{label}</Label>
          <Flex align="center" gap={4}>
            <Label 
              type="header" 
              style={[styles.value, { color: theme['text-basic-color'] }]}
              testID={`stat-value-${label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {value}
            </Label>
            {children}
          </Flex>
        </Flex>
        <View style={[styles.iconContainer, { backgroundColor: barColor + '15' }]}>
           {icon}
        </View>
      </Flex>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  topBar: {
    height: 4,
    width: '100%',
    position: 'absolute',
    top: 0,
  },
  label: {
    fontSize: 12,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
  },
  iconContainer: {
    padding: 10,
    borderRadius: 14,
  }
});
