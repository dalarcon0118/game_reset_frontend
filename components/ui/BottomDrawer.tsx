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
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Layout,Text } from '@ui-kitten/components';

const { height } = Dimensions.get('window');

interface BottomDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  title:string;
  children: React.ReactNode;
  height?: number | string;
}

export default function BottomDrawer({
  isVisible,
  onClose,
  children,
  title,
  height: drawerHeight = '30%'
}: BottomDrawerProps) {
  const translateY = useSharedValue(height);
  const opacity = useSharedValue(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (isVisible) {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 90
      });
    } else {
      opacity.value = withTiming(0, { duration: 300 });
      translateY.value = withSpring(height, {
        damping: 20,
        stiffness: 90
      });
    }
  }, [isVisible, height, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }]
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value
    };
  });

  const handleDismiss = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleModalClose = () => {
    // This function is intentionally empty to prevent
    // the modal from closing when pressing outside the drawer
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <Animated.View style={[styles.overlay, overlayStyle]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.drawerContainer,
            animatedStyle,
            { height: typeof drawerHeight === 'number' ? drawerHeight : drawerHeight },
            { paddingBottom: insets.bottom }
          ]}
        >
          <View style={styles.handle} />
          
          <TouchableWithoutFeedback onPress={handleModalClose}>
            
            <View style={styles.drawerContent}>
            <Layout >
                    <Text category="h6" style={[{padding:10}]}>{title}</Text>
                
                </Layout>
              <TouchableWithoutFeedback onPress={handleDismiss}>
                <View style={styles.closeButton}>
                  <X size={24} color="#333" />
                </View>
              </TouchableWithoutFeedback>
              <ScrollView>
                    
                    {children}
                    </ScrollView>

                
               
              
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 0,
  },
  drawerContent: {
    flex: 1,
    padding: 0,
  },
  closeButton: {
    position: 'absolute',
    top: -15,
    right: -2,
    padding: 8,
    zIndex: 1,
  },
});