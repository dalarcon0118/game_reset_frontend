import React from 'react';
import { View, ViewStyle, StyleProp, ScrollView, ScrollViewProps } from 'react-native';

export type SpacingSize = 's' | 'm' | 'l' | 'xl' | 'xxl';
export type SpacingSide = 'top' | 'bottom' | 'left' | 'right' | 'vertical' | 'horizontal' | 'all';

export interface SpacingConfig {
  type: SpacingSide;
  value: SpacingSize | number;
}

export interface BorderConfig {
  radius?: number;
  width?: number;
  color?: string;
}

export interface SizeConfig {
  value: number | string;
  max?: number | string;
  min?: number | string;
}

export type SizeProp = number | string | SizeConfig;

export type SpacingProp = SpacingSize | number | SpacingConfig | SpacingConfig[];

const SPACING: Record<SpacingSize, number> = {
  s: 4,
  m: 8,
  l: 16,
  xl: 24,
  xxl: 32,
};

export type FlexProps = {
  vertical?: boolean;
  wrap?: boolean | 'wrap' | 'nowrap' | 'wrap-reverse';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  gap?: number;
  flex?: number;
  margin?: SpacingProp;
  padding?: SpacingProp;
  style?: StyleProp<ViewStyle>;
  childrenStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  scroll?: boolean | ScrollViewProps;
  rounded?: boolean | BorderConfig;
  width?: SizeProp;
  height?: SizeProp;
  background?: string | ViewStyle;
};

export const Flex: React.FC<FlexProps> = ({
  vertical = false,
  wrap,
  justify,
  align,
  gap,
  flex,
  margin,
  padding,
  style,
  childrenStyle,
  children,
  scroll,
  rounded,
  width,
  height,
  background,
}) => {
  const getJustify = (j?: string) => {
    switch (j) {
      case 'start': return 'flex-start';
      case 'end': return 'flex-end';
      case 'center': return 'center';
      case 'between': return 'space-between';
      case 'around': return 'space-around';
      case 'evenly': return 'space-evenly';
      default: return undefined;
    }
  };

  const getAlign = (a?: string) => {
    switch (a) {
      case 'start': return 'flex-start';
      case 'end': return 'flex-end';
      case 'center': return 'center';
      case 'baseline': return 'baseline';
      case 'stretch': return 'stretch';
      default: return undefined;
    }
  };

  const getSpacingValue = (value: SpacingSize | number): number => {
    if (typeof value === 'string') {
      return SPACING[value];
    }
    return value;
  };

  const resolveSpacingStyles = (prop: SpacingProp | undefined, prefix: 'margin' | 'padding'): ViewStyle => {
    if (prop === undefined) return {};

    const styles: any = {};

    const applyStyle = (side: SpacingSide, val: SpacingSize | number) => {
      const pxValue = getSpacingValue(val);
      switch (side) {
        case 'all':
          styles[prefix] = pxValue;
          break;
        case 'vertical':
          styles[`${prefix}Vertical`] = pxValue;
          break;
        case 'horizontal':
          styles[`${prefix}Horizontal`] = pxValue;
          break;
        case 'top':
          styles[`${prefix}Top`] = pxValue;
          break;
        case 'bottom':
          styles[`${prefix}Bottom`] = pxValue;
          break;
        case 'left':
          styles[`${prefix}Left`] = pxValue;
          break;
        case 'right':
          styles[`${prefix}Right`] = pxValue;
          break;
      }
    };

    if (Array.isArray(prop)) {
      prop.forEach(config => applyStyle(config.type, config.value));
    } else if (typeof prop === 'object' && 'type' in prop) {
      applyStyle(prop.type, prop.value);
    } else {
      applyStyle('all', prop);
    }

    return styles;
  };

  const marginStyles = resolveSpacingStyles(margin, 'margin');
  const paddingStyles = resolveSpacingStyles(padding, 'padding');

  const resolveBorderStyles = (): ViewStyle => {
    if (!rounded) return {};

    const defaults = {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E4E9F2',
    };

    if (typeof rounded === 'boolean') {
      return defaults;
    }

    return {
      borderRadius: rounded.radius ?? defaults.borderRadius,
      borderWidth: rounded.width ?? defaults.borderWidth,
      borderColor: rounded.color ?? defaults.borderColor,
    };
  };

  const resolveSizeStyles = (prop: SizeProp | undefined, type: 'width' | 'height'): ViewStyle => {
    if (prop === undefined) return {};

    const styles: any = {};
    const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);

    if (typeof prop === 'object') {
      styles[type] = prop.value;
      if (prop.max !== undefined) styles[`max${capitalizedType}`] = prop.max;
      if (prop.min !== undefined) styles[`min${capitalizedType}`] = prop.min;
    } else {
      styles[type] = prop;
    }

    return styles;
  };

  const resolveBackgroundStyles = (bg?: string | ViewStyle): ViewStyle => {
    if (!bg) return {};
    if (typeof bg === 'string') {
      return { backgroundColor: bg };
    }
    return bg;
  };

  const borderStyles = resolveBorderStyles();
  const widthStyles = resolveSizeStyles(width, 'width');
  const heightStyles = resolveSizeStyles(height, 'height');
  const backgroundStyles = resolveBackgroundStyles(background);

  const layoutStyles: ViewStyle = {
    flexDirection: vertical ? 'column' : 'row',
    justifyContent: getJustify(justify),
    alignItems: getAlign(align),
    flexWrap: wrap === true ? 'wrap' : (wrap as ViewStyle['flexWrap']),
    gap,
  };

  const structuralStyles: ViewStyle = {
    flex,
    ...marginStyles,
    ...borderStyles,
    ...widthStyles,
    ...heightStyles,
    ...backgroundStyles,
  };

  const renderedChildren = childrenStyle
    ? React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child as React.ReactElement<any>, {
          style: [
            (child.props as any).style,
            childrenStyle,
          ],
        });
      }
      return child;
    })
    : children;

  if (scroll) {
    const scrollProps = typeof scroll === 'object' ? scroll : {};
    return (
      <ScrollView
        {...scrollProps}
        style={[structuralStyles, style]}
        contentContainerStyle={[
          layoutStyles,
          paddingStyles, // Padding goes to contentContainer in ScrollView
          scrollProps.contentContainerStyle
        ]}
      >
        {renderedChildren}
      </ScrollView>
    );
  }

  return (
    <View
      style={[
        layoutStyles,
        structuralStyles,
        paddingStyles, // Padding goes to View itself
        style
      ]}
    >
      {renderedChildren}
    </View>
  );
};
