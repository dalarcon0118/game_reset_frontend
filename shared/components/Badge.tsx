import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { COLORS } from '../../features/colector/common/constants';

export interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  color = '#E6FFFA', // Default light green
  textColor = COLORS.primaryDark,
  style,
  textStyle
}) => {
  return (
    <View style={[styles.container, { backgroundColor: color }, style]}>
      <Text style={[styles.text, { color: textColor }, textStyle]}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
