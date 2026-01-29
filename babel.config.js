module.exports = function (api) {
  api.cache(true);

  //Set EXPO_ROUTER_APP_ROOT  
  process.env.EXPO_ROUTER_APP_ROOT = process.env.EXPO_ROUTER_APP_ROOT || 'app';

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@shared': './shared',
            '@features': './features',
            '@core': './shared/core',
          },
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        },
      ],
    ],
    env: {
      production: {
        plugins: [],
      },
    },
  };
};
