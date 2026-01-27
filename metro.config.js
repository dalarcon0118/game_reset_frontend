// Add ReadableStream polyfill for older Node.js versions - MUST BE FIRST
global.ReadableStream = global.ReadableStream || require('web-streams-polyfill').ReadableStream;

// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add resolver to handle potential bridge issues
config.resolver = {
  ...config.resolver,
  unstable_enableSymlinks: false,
  assetExts: [
    ...config.resolver.assetExts,
    'bin',
    'txt',
    'jpg',
    'png',
    'jpeg',
    'gif',
    'svg',
    'webp',
    'ico',
    'otf',
    'ttf',
    'woff',
    'woff2',
  ],
  sourceExts: [
    ...config.resolver.sourceExts,
    'js',
    'jsx',
    'json',
    'tsx',
    'cjs',
    'mjs',
  ],
  unstable_conditionNames: ['require', 'react-native'],
  resolveRequest: (context, moduleName, platform) => {
    console.log(`[Metro] Resolving module: ${moduleName} from ${context.originModulePath}`);
    // Fix for "UnableToResolveError" when HMR or Metro tries to resolve with redundant prefix
    // e.g. "./frontend/node_modules/expo-router/entry" -> "./node_modules/expo-router/entry"
    if (moduleName.startsWith('./frontend/') || moduleName.startsWith('frontend/')) {
      const newModuleName = moduleName.replace(/^(\.\/)?frontend\//, './');
      console.log(`[Metro] Resolving module: ${moduleName} -> ${newModuleName}`);
      return context.resolveRequest(context, newModuleName, platform);
    }

    // Default resolution
    return context.resolveRequest(context, moduleName, platform);
  },
};

// Add transformer to handle potential bridge communication issues
config.transformer = {
  ...config.transformer,
  experimentalImportSupport: false,
  inlineRequires: true,
  unstable_allowRequireContext: true,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Add server configuration to handle bridge communication
config.server = {
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Fix for 404 error when requests include redundant /frontend/ prefix
      // This happens when the dev client expects the project root to be the monorepo root
      if (req.url.startsWith('/frontend/')) {
        console.log(`[Metro] Rewriting URL: ${req.url} -> ${req.url.replace('/frontend/', '/')}`);
        req.url = req.url.replace('/frontend/', '/');
      }

      // Add headers to handle bridge communication
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }
      
      // Important: Call the actual Metro middleware (the bundler)
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
