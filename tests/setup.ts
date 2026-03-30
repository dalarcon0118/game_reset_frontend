
// Mock for global setup if needed
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  configure: jest.fn(),
  fetch: jest.fn(),
  refresh: jest.fn(),
  addEventListener: jest.fn(),
  useNetInfo: jest.fn(),
}));

// Mock LogBox for tests
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.LogBox = {
    ignoreLogs: jest.fn(),
    ignoreAllLogs: jest.fn(),
  };
  return RN;
});
