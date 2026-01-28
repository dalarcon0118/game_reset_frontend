import { Easing } from 'react-native-reanimated';

export const DEFAULT_DURATION = 300;

export const Transitions = {
  EASE_IN_OUT: {
    duration: DEFAULT_DURATION,
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  },
  EASE_OUT: {
    duration: DEFAULT_DURATION,
    easing: Easing.bezier(0, 0, 0.2, 1),
  },
  EASE_IN: {
    duration: DEFAULT_DURATION,
    easing: Easing.bezier(0.4, 0, 1, 1),
  },
  BOUNCE: {
    duration: DEFAULT_DURATION,
    easing: Easing.bezier(0.2, -0.1, 0.1, 1.5),
  },
};