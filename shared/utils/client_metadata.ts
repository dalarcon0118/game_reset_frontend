import Constants from 'expo-constants';

export interface ClientMetadata {
  appVersion: string;
  runtimeVersion: string;
  platform: string;
  systemVersion: string;
  deviceName: string;
  isDevice: boolean;
  expoVersion: string;
}

export const getClientMetadata = (): ClientMetadata => {
  return {
    appVersion: Constants.expoConfig?.version || 'unknown',
    runtimeVersion: Constants.runtimeVersion || 'unknown',
    platform: Constants.platform || 'unknown',
    systemVersion: Constants.systemVersion || 'unknown',
    deviceName: Constants.deviceName || 'unknown',
    isDevice: Constants.isDevice ?? true,
    expoVersion: Constants.expoVersion || 'unknown'
  };
};