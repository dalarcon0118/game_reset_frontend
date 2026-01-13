// https://docs.expo.dev/guides/using-eslint/
const path = require('path');

module.exports = {
  extends: 'expo',
  plugins: ['import'],
  ignorePatterns: ['/dist/*'],
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: [path.resolve(__dirname, 'tsconfig.json')],
      },
    },
  },
};
