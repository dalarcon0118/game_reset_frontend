import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
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
  return (
    <Card
      style={[styles.container, style]}
      padding={0} // Custom padding handling due to topBar
    >
      <View style={[styles.topBar, { backgroundColor: barColor }]} />

      <Flex
        justify="between"
        align="center"
        padding={[{ type: 'horizontal', value: 16 }, { type: 'vertical', value: 16 }]}
      >
        <Flex vertical gap={4}>
          <Label type="detail" style={styles.label}>{label}</Label>
          <Flex align="center" gap={4}>
            <Label type="header" style={{ fontSize: 20 }}>{value}</Label>
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
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0,
    shadowColor: "#000",
    
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  topBar: {
    height: 4,
    width: '100%',
    position: 'absolute',
    top: 0,
  },
  label: {
    opacity: 0.6,
    fontSize: 12,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 12,
  }
});
