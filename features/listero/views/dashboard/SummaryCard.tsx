import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from '@ui-kitten/components';
import { TrendingDown, TrendingUp, DollarSign } from 'lucide-react-native';
import Layout from '@/constants/Layout';

interface SummaryCardProps {
  title: string;
  amount: number;
  type: 'collected' | 'paid' | 'net';
  index?: number;
}

export default function SummaryCard({
  title,
  amount,
  type,
  index = 0,
}: SummaryCardProps) {
  const theme = useTheme();
  
  const getIcon = () => {
    const iconSize = 18; // Reduced from 24 to 18
    const iconProps = { size: iconSize, strokeWidth: 2 };
    
    switch (type) {
      case 'collected':
        return <DollarSign color={theme['color-success-500']} {...iconProps} />;
      case 'paid':
        return <TrendingDown color={theme['color-danger-500']} {...iconProps} />;
      case 'net':
        return <TrendingUp color={amount >= 0 ? theme['color-success-500'] : theme['color-danger-500']} {...iconProps} />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'collected':
        return theme['color-success-100'];
      case 'paid':
        return theme['color-danger-100'];
      case 'net':
        return amount >= 0 ? theme['color-success-100'] : theme['color-danger-100'];
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'collected':
        return theme['color-success-500'];
      case 'paid':
        return theme['color-danger-500'];
      case 'net':
        return amount >= 0 ? theme['color-success-500'] : theme['color-danger-500'];
    }
  };

  return (
    <Card
      style={styles.card}
      appearance='filled'
      status={type === 'collected' ? 'success' : type === 'paid' ? 'danger' : (amount >= 0 ? 'success' : 'danger')}
    >
      <View style={styles.titleContainer}>
        <Text 
          category='c1'
          style={{ textAlign: 'left' ,marginLeft: -20}}
        >
          {title}
        </Text>
      </View>
      <View style={styles.contentContainer}>
        <View style={[styles.iconContainer, { backgroundColor: getBgColor() }]}>
          {getIcon()}
      </View>
        <Text
          category='c2'
          style={{ color: getTextColor() }}
        >
          ${Math.abs(amount).toFixed(2)}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: Layout.spacing.xs,
    padding: Layout.spacing.xs,
    minWidth: 100,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: Layout.borderRadius.sm,
  },
  titleContainer: {
    marginBottom: Layout.spacing.xs,
    alignItems: 'flex-start', // Add this to align content to the left
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: -20,
    justifyContent: 'space-between',
  },
  iconContainer: {
    padding: Layout.spacing.xs,
    borderRadius: 6, // Using a direct value as Layout.borderRadius.sm might not be available
  },
});