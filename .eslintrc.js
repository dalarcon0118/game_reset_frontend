// https://docs.expo.dev/guides/using-eslint/
const path = require('path');

module.exports = {
  extends: 'expo',
  plugins: ['import'],
  env: {
    node: true,
  },
  ignorePatterns: [
    '/dist/*',
    '_app/**',
    'app/(admin)/**',
    'features/listero/bet-loteria/loteria.feature.ts',
    'features/listero/bet-loteria/loteria/loteria.registry.ts',
    'shared/components/bets/centenas_column.tsx',
    'shared/components/dataview/**',
    'shared/context/auth_context.tsx',
    'shared/core/cmd.algebraic.ts',
    'shared/core/middlewares/**',
    'shared/core/remote.data.example.ts',
    'shared/core/return.example.ts',
    'shared/core/tea-utils/middleware.types.ts',
    'shared/core/tea/types.ts',
    'tests/architecture.test.ts',
    'tests/features/listero/integrity.test.ts',
  ],
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: [path.resolve(__dirname, 'tsconfig.json')],
      },
    },
  },
};
