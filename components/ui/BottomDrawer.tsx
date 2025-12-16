import React, { useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  ScrollView
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Layout, Text } from '@ui-kitten/components';
import { useBottomDrawer } from "./useBottomDrawer";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomDrawerProps {
  isVisible?: boolean;
  onClose?: () => void;
  title?: string;
  height?: number | string;
  children?: React.ReactNode;
}

export default function BottomDrawer(props: BottomDrawerProps = {}) {
  // Si se pasan props, NO usar el hook (evita error de provider)
  const hasProps = props.isVisible !== undefined;

  let drawer, closeDrawer;
  if (!hasProps) {
    // Solo usar hook si no hay props
    const hookData = useBottomDrawer();
    drawer = hookData.drawer;
    closeDrawer = hookData.closeDrawer;
  } else {
    // Cuando hay props, usar valores por defecto para drawer
    drawer = { isVisible: false, title: '', content: null, height: '40%' };
    closeDrawer = () => { }; // Función vacía por defecto
  }

  const isVisible = props.isVisible ?? drawer.isVisible;
  const onClose = props.onClose ?? closeDrawer;
  const title = props.title ?? drawer.title;
  const content = props.children ?? drawer.content;
  const height = props.height ?? drawer.height;

  const insets = useSafeAreaInsets();

  // Animaciones
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      overlayOpacity.value = withTiming(1, { duration: 0 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 180 });
    } else {
      overlayOpacity.value = withTiming(0, { duration: 0 });
      translateY.value = withSpring(SCREEN_HEIGHT, { damping: 20, stiffness: 180 });
    }
  }, [isVisible]);

  const animatedDrawer = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedOverlay = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const handleDismiss = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
      >
        {/* Overlay */}
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <Animated.View style={[styles.overlay, animatedOverlay]} />
        </TouchableWithoutFeedback>

        {/* Drawer */}
        <Animated.View
          style={[
            styles.drawerContainer,
            animatedDrawer,
            {
              height: (height ?? '30%') as any,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.drawerContent}>
            <Layout>
              <Text category="h6" >{title}</Text>
            </Layout>

            <TouchableWithoutFeedback onPress={handleDismiss}>
              <View style={styles.closeButton}>
                <X size={24} color="#333" />
              </View>
            </TouchableWithoutFeedback>
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {content}
            </ScrollView>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: { flex: 1, justifyContent: 'flex-end' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 12,
    paddingTop: 5,
  },
  handle: {
    width: 45,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DDD',
    alignSelf: 'center',
    marginBottom: 6,
  },
  drawerContent: {
    flex: 1,
    paddingHorizontal: 10,
  },
  closeButton: {
    position: 'absolute',
    top: -10,
    right: 0,
    padding: 10,
    zIndex: 10,
  }
});
