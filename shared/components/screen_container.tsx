import React from 'react';
import {
  View,
  ViewStyle,
  StyleProp,
  ScrollView,
  ScrollViewProps,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';
import { useResponsiveSpacing } from '../hooks/use_responsive_spacing';

export type ScreenContainerEdges = SafeAreaViewProps['edges'];

export interface ScreenContainerProps {
  /** Safe area edges a aplicar. Default: ['top', 'left', 'right', 'bottom'] */
  edges?: ScreenContainerEdges;
  /** Si debe incluir KeyboardAvoidingView. Default: false */
  keyboardAvoiding?: boolean;
  /** Behavior del KeyboardAvoidingView. Auto-detectado si no se especifica */
  keyboardBehavior?: 'padding' | 'height' | 'position';
  /** Offset vertical para el teclado */
  keyboardVerticalOffset?: number;
  /** Si el contenido debe ser scrollable. Default: false */
  scrollable?: boolean;
  /** Props adicionales para ScrollView */
  scrollViewProps?: ScrollViewProps;
  /** Color de fondo */
  backgroundColor?: string;
  /** Si debe dismiss el teclado al tocar fuera. Default: false */
  dismissOnTouchOutside?: boolean;
  /** Estilo adicional del contenedor */
  style?: StyleProp<ViewStyle>;
  /** Estilo del contenido interno */
  contentStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * ScreenContainer
 * Componente envoltorio estándar para pantallas que combina:
 * - SafeAreaView de react-native-safe-area-context (funciona en Android e iOS)
 * - KeyboardAvoidingView (funcionando correctamente en ambas plataformas)
 * - ScrollView opcional con configuración correcta para teclado
 *
 * Reemplaza el patrón manual de:
 *   <SafeAreaView> + <KeyboardAvoidingView> + <ScrollView>
 *
 * @example
 * <ScreenContainer edges={['top', 'bottom']} keyboardAvoiding>
 *   <TextInput ... />
 *   <Button ... />
 * </ScreenContainer>
 */
export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  edges = ['top', 'left', 'right', 'bottom'],
  keyboardAvoiding = false,
  keyboardBehavior,
  keyboardVerticalOffset = 0,
  scrollable = false,
  scrollViewProps,
  backgroundColor,
  dismissOnTouchOutside = false,
  style,
  contentStyle,
  children,
}) => {
  const { spacing } = useResponsiveSpacing();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor,
  };

  const contentContainerStyle: ViewStyle = {
    flex: scrollable ? undefined : 1,
  };

  // Determinar behavior automáticamente si no se especifica
  const behavior = keyboardBehavior ?? (Platform.OS === 'ios' ? 'padding' : 'height');

  const renderContent = () => {
    const content = (
      <View style={[contentContainerStyle, contentStyle]}>
        {children}
      </View>
    );

    if (scrollable) {
      return (
        <ScrollView
          {...scrollViewProps}
          style={{ flex: 1 }}
          contentContainerStyle={[
            { flexGrow: 1, paddingBottom: spacing.l },
            scrollViewProps?.contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      );
    }

    return content;
  };

  const renderWithKeyboard = () => {
    if (!keyboardAvoiding) return renderContent();

    return (
      <KeyboardAvoidingView
        behavior={behavior}
        keyboardVerticalOffset={keyboardVerticalOffset}
        style={{ flex: 1 }}
      >
        {renderContent()}
      </KeyboardAvoidingView>
    );
  };

  const renderWithDismiss = () => {
    if (!dismissOnTouchOutside) return renderWithKeyboard();

    return (
      <TouchableWithoutFeedback
        onPress={(e) => {
          // Solo dismiss si el target es el contenedor mismo (no hijos interactivos)
          if ((e.target as any) === (e.currentTarget as any)) {
            Keyboard.dismiss();
          }
        }}
        accessible={false}
      >
        <View style={{ flex: 1 }}>
          {renderWithKeyboard()}
        </View>
      </TouchableWithoutFeedback>
    );
  };

  return (
    <SafeAreaView edges={edges} style={[containerStyle, style]}>
      {renderWithDismiss()}
    </SafeAreaView>
  );
};
