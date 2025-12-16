import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { Flex } from '../../../shared/components/Flex';
import { Label } from '../../../shared/components/Label';

interface GridStatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  barColor: string;
  secondaryContent?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const GridStatCard: React.FC<GridStatCardProps> = ({ label, value, icon, barColor, secondaryContent, style }) => {
  return (
    <Card 
      style={[styles.container, style]} 
      padding={0} // Custom padding handling due to topBar
    >
      <View style={[styles.topBar, { backgroundColor: barColor }]} />
      
      <Flex 
        justify="between" 
        align="start" 
        padding="l"
      >
        <Flex vertical>
          <Label type="detail" style={styles.labelMargin}>{label}</Label>
          <Flex align="center">
             <Label type="number">{value}</Label>
             {secondaryContent}
          </Flex>
        </Flex>
        {icon}
      </Flex>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    marginBottom: 16,
    overflow: 'hidden',
  },
  topBar: {
    height: 4,
    width: '100%',
  },
  labelMargin: {
    marginBottom: 4,
  }
});
