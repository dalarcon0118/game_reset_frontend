import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';

export interface IconBoxProps {
  children: React.ReactNode;
  size?: number;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
}

export const IconBox: React.FC<IconBoxProps> = ({ 
  children, 
  size = 44, 
  backgroundColor = '#F7F9FC',
  style 
}) => {
  return (
    <View style={[
      styles.container, 
      { 
        width: size, 
        height: size, 
        borderRadius: size / 3.5, // Proportional border radius
        backgroundColor 
      },
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
