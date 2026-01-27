import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, TouchableOpacity } from 'react-native';

export interface CardProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  padding = 16,
  onPress 
}) => {
  const containerStyles = [
    styles.container, 
    { padding },
    style
  ];

  if (onPress) {
    return (
      <TouchableOpacity 
        style={containerStyles} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyles}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
});
