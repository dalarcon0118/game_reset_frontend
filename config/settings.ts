// /Users/davidmartinez/develop/game-reset/demos/Game-Reset/frontend/config/settings.ts

// Utiliza variables de entorno para configuraciones sensibles o que cambian entre entornos.
// Puedes usar un paquete como 'expo-constants' o 'react-native-dotenv' para manejarlas.

// Ejemplo con expo-constants (si estás usando Expo)
// import Constants from 'expo-constants';

// const manifest = Constants.manifest;

// API Configuration
const API_BASE_URL_DEVELOPMENT = 'http://localhost:8000/api'; // URL de tu backend en desarrollo
const API_BASE_URL_PRODUCTION = 'https://your-production-api.com/api'; // URL de tu backend en producción

// Determinar si estamos en modo de desarrollo o producción
// Esto puede variar dependiendo de cómo construyas tu app (ej. variables de entorno)
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'; // O __DEV__ para React Native

export const settings = {
  api: {
    baseUrl: IS_DEVELOPMENT ? API_BASE_URL_DEVELOPMENT : API_BASE_URL_PRODUCTION,
    timeout: 10000, // Tiempo de espera para las peticiones API en milisegundos
    endpoints: {
      auth: '/auth',
      login: '/auth/login/',
      register: '/auth/register/',
      users: '/users/',
      structures: '/structures/',
      bets: '/bets/',
      draws: '/draws/',
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