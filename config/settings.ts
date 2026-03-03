
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { logger } from '../shared/utils/logger';

const log = logger.withTag('SETTINGS');

// API Configuration
// En emuladores de Android, localhost es el propio emulador. 
// Para acceder al host (tu máquina), usa 10.0.2.2
const getDevelopmentBaseUrl = () => {
  // En emuladores de Android, localhost es el propio emulador. 
  // Para acceder al host (tu máquina), usa 10.0.2.2 o la IP detectada por Expo

  // Intentamos obtener la IP del host desde Expo Constants
  const debuggerHost = Constants.expoConfig?.hostUri;
  const host = debuggerHost?.split(':').shift();

  if (host) {
    log.debug('Detected Host IP from Expo', { host });
    return `http://${host}:8000/api`;
  }

  if (Platform.OS === 'android') {
    // Fallback para Android si no se detecta hostUri
    return 'http://10.0.2.2:8000/api';
  }
  return 'http://localhost:8000/api';
};

const API_BASE_URL_DEVELOPMENT = getDevelopmentBaseUrl();
const API_BASE_URL_PRODUCTION = process.env.EXPO_PUBLIC_API_URL || 'https://uk80ggc4c00og4s0ocogckwo.149.130.221.251.ssli.io/api'; // URL de Render

// Determinar si estamos en modo de desarrollo o producción
// Intentamos obtener APP_ENV de múltiples fuentes para mayor robustez en Expo
const APP_ENV =
  process.env.EXPO_PUBLIC_APP_ENV ||
  process.env.APP_ENV ||
  Constants.expoConfig?.extra?.APP_ENV ||
  (process.env.NODE_ENV === 'production' ? 'production' : 'development');

log.info('Environment detection', {
  APP_ENV,
  IS_DEVELOPMENT: APP_ENV === 'production' ? false : (APP_ENV === 'development' || __DEV__),
  API_URL: (APP_ENV === 'production' ? false : (APP_ENV === 'development' || __DEV__))
    ? API_BASE_URL_DEVELOPMENT
    : API_BASE_URL_PRODUCTION
});

// Si APP_ENV es production, forzamos IS_DEVELOPMENT a false independientemente de __DEV__
const IS_DEVELOPMENT = APP_ENV === 'production' ? false : (APP_ENV === 'development' || __DEV__);

export const settings = {
  api: {
    baseUrl: IS_DEVELOPMENT ? API_BASE_URL_DEVELOPMENT : API_BASE_URL_PRODUCTION,
    timeout: 60000, // Default 60s timeout for Render cold starts
    timeoutProfiles: {
      FAST: 15000,    // 15s for auth/validations
      NORMAL: 60000, // 60s for standard CRUD
      SLOW: 120000    // 120s for reports/heavy data
    },
    defaults: {
      cacheTTL: 5 * 60 * 1000, // 5 minutes default cache
      retryCount: 3,           // 3 retries default
    },
    endpoints: {
      public: [
        '/auth/login/',
        '/auth/register/',
        '/auth/login/refresh/',
        '/public/config',
      ],
      auth: () => '/auth',
      login: () => '/auth/login/',
      refresh: () => '/auth/login/refresh/',
      logout: () => '/auth/logout/',
      me: () => '/auth/me/',
      register: () => '/auth/register/',
      users: () => '/users/',
      structures: () => '/structures/',
      bets: () => '/bets/',
      draws: () => '/draw/draws/',
      incidents: () => '/incidents/',
      closureConfirmations: () => '/draw/draw-closure-confirmations/',
      changePin: () => '/auth/change-pin/',
      financialStatement: () => '/financial-statement/summary/',
      financialStatements: () => '/financial-statement/',
      dashboardStats: () => '/financial-statement/dashboard-stats/',
      // ...otros endpoints de tu API
    },
  },
  timeIntegrity: {
    maxJumpMs: 5 * 60 * 1000, // 5 minutes threshold for forward jumps
    maxBackwardMs: 2000,      // 2 seconds tolerance for minor clock drifts/adjustments
  },
  featureFlags: {
    enableNewDashboard: true,
    enableExperimentalFeature: false,
    // ...otros feature flags
  },
  ui: {
    theme: 'light', // 'light' | 'dark'
    defaultLanguage: 'es', // Código de idioma por defecto (ej. 'en', 'es')
    // ...otras configuraciones de UI
  },
  pagination: {
    defaultPageSize: 20,
  },
  // Otras configuraciones generales de la aplicación
  appName: 'Game Reset App',
  version: '1.0.0', // manifest?.version || '1.0.0',
  // Podrías añadir aquí configuraciones específicas de Expo si las necesitas
  // expo: {
  //   apiKey: manifest?.extra?.expoApiKey || '',
  // },
};

// Ejemplo de cómo podrías acceder a una configuración:
// import { settings } from './settings';
// const apiUrl = `${settings.api.baseUrl}${settings.api.endpoints.login}`;

export default settings;
