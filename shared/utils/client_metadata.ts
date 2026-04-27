import Constants from 'expo-constants';
import { getAppVersion } from './app_version';

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
    appVersion: getAppVersion(),
    runtimeVersion: Constants.runtimeVersion || 'unknown',
    platform: Constants.platform || 'unknown',
    systemVersion: Constants.systemVersion || 'unknown',
    deviceName: Constants.deviceName || 'unknown',
    isDevice: Constants.isDevice ?? true,
    expoVersion: Constants.expoVersion || 'unknown'
  };
};