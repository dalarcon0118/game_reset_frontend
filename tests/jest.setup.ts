// tests/jest.setup.ts
import 'react-native-gesture-handler/jestSetup';
import { EventSourcePolyfill } from 'event-source-polyfill';

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

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    mergeItem: jest.fn(),
    clear: jest.fn(),
    getAllKeys: jest.fn(),
    flushGetRequests: jest.fn(),
    multiGet: jest.fn(),
    multiSet: jest.fn(),
    multiRemove: jest.fn(),
    multiMerge: jest.fn(),
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
