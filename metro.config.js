// Add ReadableStream polyfill for older Node.js versions - MUST BE FIRST
global.ReadableStream = global.ReadableStream || require('web-streams-polyfill').ReadableStream;

// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Exclude heavy directories that are not needed for the frontend bundle
config.resolver.blockList = exclusionList([
  /backend\/.*/,
  /specifications\/.*/,
  /\.work\/.*/,
  /admin-dashboard\/.*/,
  /frontend\/tests\/.*/,
  /frontend\/scripts\/.*/,
  /\.trae\/.*/,
  /\.expo\/.*/,
  /\.vscode\/.*/,
  /.*\/android\/app\/build\/.*/,
  /.*\/ios\/build\/.*/,
]);

// Add resolver to handle potential bridge issues
config.resolver = {
  ...config.resolver,
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
  /*
  resolveRequest: (context, moduleName, platform) => {
    // Fix for "UnableToResolveError" when HMR or Metro tries to resolve with redundant prefix
    // e.g. "./frontend/node_modules/expo-router/entry" -> "./node_modules/expo-router/entry"
    if (moduleName.startsWith('./frontend/') || moduleName.startsWith('frontend/')) {
      const newModuleName = moduleName.replace(/^(\.\/)?frontend\//, './');
      return context.resolveRequest(context, newModuleName, platform);
    }

    // Default resolution
    return context.resolveRequest(context, moduleName, platform);
  },
  */
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
