import Constants from 'expo-constants';

export const getAppVersion = (): string => {
  // 1. manifest.version - la fuente correcta en SDK 52+
  console.log('Constants.expoConfig.version', Constants.expoConfig?.version);
  if (Constants.expoConfig?.version) {
    return Constants.expoConfig.version;
  }
  // 2. nativeAppVersion - para builds nativos
  if (Constants.nativeAppVersion) {
    return Constants.nativeAppVersion;
  }
  // 3. NO usar expoConfig - está deprecated en SDK 52+
  return 'N/A.0.0'; // fallback hardcoded
};