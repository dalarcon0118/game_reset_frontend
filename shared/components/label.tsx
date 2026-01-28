import React from 'react';
import { StyleSheet, StyleProp, TextStyle } from 'react-native';
import { Text, TextProps } from '@ui-kitten/components';
import { COLORS } from './constants';

export type LabelType = 'title' | 'subtitle' | 'header' | 'subheader' | 'date' | 'number' | 'detail' | 'error' | 'default';

interface LabelProps extends Omit<TextProps, 'children'> {
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
  value?: string | number;
  type?: LabelType;
}

export const Label: React.FC<LabelProps> = ({ style, children, value, type = 'default', ...props }) => {
  const getStyleByType = (t: LabelType): StyleProp<TextStyle> => {
    switch (t) {
      case 'title':
        return styles.title;
      case 'subtitle':
        return styles.subtitle;
      case 'header':
        return styles.header;
      case 'subheader':
        return styles.subheader;
      case 'date':
        return styles.date;
      case 'number':
        return styles.number;
      case 'detail':
        return styles.detail;
      case 'error':
        return styles.error;
      default:
        return styles.default;
    }
  };

  const content = value !== undefined ? value : children;

  // Prevent rendering objects as children, which causes React errors in Native
  let safeContent = content;
  if (Array.isArray(content)) {
    // If it's an array, filter out null/undefined/objects and join without spaces
    safeContent = content
      .filter(item => 
        item !== null && 
        item !== undefined && 
        typeof item !== 'boolean'
      )
      .map(item => 
        (typeof item === 'object' && !React.isValidElement(item))
          ? ''
          : item
      )
      .join('');
  } else if (typeof content === 'object' && content !== null && !React.isValidElement(content)) {
    // If it's a single object that isn't a React element, don't render it
    safeContent = '';
  }

  return (
    <Text style={[getStyleByType(type), style]} {...props}>
      {safeContent as any}
    </Text>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  header: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  subheader: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  date: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  number: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  detail: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  error: {
    fontSize: 14,
    color: COLORS.danger,
    fontWeight: '600',
  },
  default: {
    fontSize: 14,
    color: COLORS.textDark,
  },
});
