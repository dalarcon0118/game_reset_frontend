// tests/jest.setup.ts
import 'react-native-gesture-handler/jestSetup';
import { EventSourcePolyfill } from 'event-source-polyfill';

jest.mock('@/shared/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        withTag: jest.fn().mockReturnThis(),
    },
}));

// Polyfill EventSource for Node/Jest environment
if (typeof global.EventSource === 'undefined') {
    (global as any).EventSource = EventSourcePolyfill;
}

// fetchMock.enableMocks() removido para permitir integracion real

jest.mock('expo-constants', () => ({
    expoConfig: {
        extra: {
            APP_ENV: 'development'
        }
    },
    manifest: {
        version: '1.0.0'
    }
}));

jest.mock('expo-crypto', () => ({
    digestStringAsync: jest.fn().mockResolvedValue('mock-hash'),
    CryptoDigestAlgorithm: {
        SHA256: 'SHA256'
    }
}));

jest.mock('expo-modules-core', () => ({
    EventEmitter: jest.fn().mockImplementation(() => ({
        addListener: jest.fn(),
        removeListeners: jest.fn(),
        removeAllListeners: jest.fn(),
        emit: jest.fn(),
    })),
    NativeModulesProxy: {},
    ProxyNativeModule: {},
}));

jest.mock('expo-secure-store', () => ({
    setItemAsync: jest.fn(),
    getItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

let internalAsyncStorage: Record<string, string> = {};
const mockAsyncStorage = {
    setItem: jest.fn(async (key: string, value: string) => {
        internalAsyncStorage[key] = value;
    }),
    getItem: jest.fn(async (key: string) => internalAsyncStorage[key] || null),
    removeItem: jest.fn(async (key: string) => {
        delete internalAsyncStorage[key];
    }),
    mergeItem: jest.fn(),
    clear: jest.fn(async () => { internalAsyncStorage = {}; }),
    getAllKeys: jest.fn(async () => Object.keys(internalAsyncStorage)),
    flushGetRequests: jest.fn(),
    multiGet: jest.fn(async (keys: string[]) => {
        return keys.map(key => [key, internalAsyncStorage[key] || null]);
    }),
    multiSet: jest.fn(async (pairs: [string, string][]) => {
        pairs.forEach(([key, value]) => {
            internalAsyncStorage[key] = value;
        });
    }),
    multiRemove: jest.fn(async (keys: string[]) => {
        keys.forEach(key => {
            delete internalAsyncStorage[key];
        });
    }),
    multiMerge: jest.fn(),
    _getStorage: () => internalAsyncStorage,
    _resetStorage: () => { internalAsyncStorage = {}; }
};

jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: mockAsyncStorage,
    ...mockAsyncStorage
}));

jest.mock('expo-router', () => ({
    router: {
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
    },
    useLocalSearchParams: jest.fn(() => ({})),
    useSearchParams: jest.fn(() => ({})),
    usePathname: jest.fn(() => ''),
}));

// Mock for UI Kitten
jest.mock('@ui-kitten/components', () => {
    const React = require('react');
    const { View, Text, TouchableOpacity } = require('react-native');

    return {
        Layout: ({ children }: any) => React.createElement(View, {}, children),
        Text: ({ children }: any) => React.createElement(Text, {}, children),
        Button: ({ children, onPress, ...props }: any) =>
            React.createElement(TouchableOpacity, { onPress, ...props },
                React.createElement(Text, {}, children)
            ),
        Icon: () => null,
        Card: ({ children, header, footer, ...props }: any) =>
            React.createElement(View, props, [
                header && React.createElement(View, { key: 'header' }, header()),
                React.createElement(View, { key: 'content' }, children),
                footer && React.createElement(View, { key: 'footer' }, footer()),
            ]),
        List: ({ data, renderItem, ...props }: any) =>
            React.createElement(View, props, data.map((item: any, index: number) => renderItem({ item, index }))),
        Divider: () => React.createElement(View),
        TopNavigation: ({ title, accessoryLeft, accessoryRight }: any) =>
            React.createElement(View, {}, [
                accessoryLeft && React.createElement(View, { key: 'left' }, accessoryLeft()),
                React.createElement(Text, { key: 'title' }, typeof title === 'function' ? title() : title),
                accessoryRight && React.createElement(View, { key: 'right' }, accessoryRight()),
            ]),
        TopNavigationAction: ({ icon, onPress }: any) =>
            React.createElement(TouchableOpacity, { onPress }, icon()),
        Datepicker: () => null,
        useTheme: () => ({}),
        StyleService: {
            create: (obj: any) => obj,
        },
        useStyleSheet: (style: any) => style,
    };
});

jest.mock('@react-native-community/netinfo', () => ({
    configure: jest.fn(),
    fetch: jest.fn(),
    addEventListener: jest.fn(),
    useNetInfo: jest.fn(),
}));
