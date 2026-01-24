// /Users/davidmartinez/develop/game-reset/demos/Game-Reset/frontend/config/settings.ts

// Utiliza variables de entorno para configuraciones sensibles o que cambian entre entornos.
// Puedes usar un paquete como 'expo-constants' o 'react-native-dotenv' para manejarlas.

// Ejemplo con expo-constants (si estás usando Expo)
// import Constants from 'expo-constants';

// const manifest = Constants.manifest;

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// API Configuration
// En emuladores de Android, localhost es el propio emulador. 
// Para acceder al host (tu máquina), usa 10.0.2.2
const getDevelopmentBaseUrl = () => {
  if (Platform.OS === 'android') {
    // Intentar primero con la IP de la red local del host si 10.0.2.2 falla
    // Tu IP local detectada es 10.0.0.169
    return 'http://10.0.0.169:8000/api';
  }
  return 'http://localhost:8000/api';
};

const API_BASE_URL_DEVELOPMENT = getDevelopmentBaseUrl();
const API_BASE_URL_PRODUCTION = 'https://game-reset-backend.onrender.com/api'; // URL de Render

// Determinar si estamos en modo de desarrollo o producción
// Intentamos obtener APP_ENV de múltiples fuentes para mayor robustez en Expo
const APP_ENV =
  process.env.EXPO_PUBLIC_APP_ENV ||
  process.env.APP_ENV ||
  Constants.expoConfig?.extra?.APP_ENV ||
  (process.env.NODE_ENV === 'production' ? 'production' : 'development');

console.log('Detected APP_ENV:', APP_ENV);

// Si APP_ENV es production, forzamos IS_DEVELOPMENT a false independientemente de __DEV__
const IS_DEVELOPMENT = APP_ENV === 'production' ? false : (APP_ENV === 'development' || __DEV__);

console.log('IS_DEVELOPMENT mode:', IS_DEVELOPMENT);
console.log('Using API URL:', IS_DEVELOPMENT ? API_BASE_URL_DEVELOPMENT : API_BASE_URL_PRODUCTION);

export const settings = {
  api: {
    baseUrl: IS_DEVELOPMENT ? API_BASE_URL_DEVELOPMENT : API_BASE_URL_PRODUCTION,
    timeout: 10000, // Tiempo de espera para las peticiones API en milisegundos
    endpoints: {
      auth: () => '/auth',
      login: () => '/auth/token/',
      refresh: () => '/auth/token/refresh/',
      logout: () => '/auth/logout/',
      me: () => '/auth/me/',
      register: () => '/auth/register/',
      users: () => '/users/',
      structures: () => '/structures/',
      bets: () => '/bets/',
      draws: () => '/draw/draws/',
      incidents: () => '/incidents/',
      changePin: () => '/auth/change-pin/',
      financialStatement: () => '/financial-statement/summary/',
      financialStatements: () => '/financial-statement/',
      dashboardStats: () => '/financial-statement/dashboard-stats/',
      // ...otros endpoints de tu API
    },
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
