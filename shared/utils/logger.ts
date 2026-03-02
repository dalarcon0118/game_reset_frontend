/**
 * Centralized logging utility for the Game-Reset application.
 * Provides consistent formatting and can be extended to send logs to external services.
 * 
 * BEST PRACTICES:
 * - ERROR: Use for failures that stop a process (API errors, exceptions).
 * - WARN: Use for unexpected states that don't stop the app (retries, missing non-critical data).
 * - INFO: Use for significant app lifecycle events (Login, Navigation, Sync start/end).
 * - DEBUG: Use for detailed developer info (Msg dispatch, state changes). Hidden in production.
 * 
 * Use .withTag('MY_TAG') to create a scoped logger for your module.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogContext {
    traceId?: string;
    category?: 'BUSINESS' | 'INFRA' | 'NETWORK' | 'UI';
    importance?: 'HIGH' | 'LOW';
    [key: string]: any;
}

/**
 * Genera un color consistente (hex) basado en una cadena de texto.
 * Utiliza el algoritmo djb2 para crear un hash y mapearlo a colores HSL vibrantes.
 */
function generateColorFromTag(tag: string): string {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Usar HSL para generar colores vibrantes y diferenciables
    // Saturación alta (70-90%) para visibility, Luminosidad media (45-65%)
    const h = Math.abs(hash % 360);
    const s = 70 + (Math.abs(hash) % 20); // 70-90%
    const l = 45 + (Math.abs(hash) % 20); // 45-65%

    return hslToHex(h, s, l);
}

/**
 * Convierte HSL a Hex para usar en CSS
 */
function hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

// Paleta de colores por nivel de log
const LEVEL_COLORS: Record<LogLevel, string> = {
    info: '#4ECDC4',
    warn: '#F39C12',
    error: '#E74C3C',
    debug: '#95A5A6',
};

// ANSI colors for terminal (Metro Bundler / Node.js)
const ANSI_COLORS: Record<LogLevel | 'reset', string> = {
    info: '\x1b[36m',  // Cyan
    warn: '\x1b[33m',  // Yellow
    error: '\x1b[31m', // Red
    debug: '\x1b[90m', // Gray
    reset: '\x1b[0m',
};

const ANSI_TAG_COLORS = [
    '\x1b[32m', // Green
    '\x1b[34m', // Blue
    '\x1b[35m', // Magenta
    '\x1b[92m', // Light Green
    '\x1b[94m', // Light Blue
    '\x1b[95m', // Light Magenta
    '\x1b[96m', // Light Cyan
];

function getAnsiColorFromTag(tag: string): string {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    return ANSI_TAG_COLORS[Math.abs(hash) % ANSI_TAG_COLORS.length];
}

// Detect environment
// In React Native, we might be in the remote debugger (Chrome) or in the terminal (Metro)
const isBrowser = typeof document !== 'undefined';
const isRemoteDebugger = typeof window !== 'undefined' && !!(window as any).chrome;
const useBrowserFormatting = isBrowser || isRemoteDebugger;

class Logger {
    private context: LogContext = {};

    constructor(context: LogContext = {}) {
        this.context = context;
        this.info = this.info.bind(this);
        this.warn = this.warn.bind(this);
        this.error = this.error.bind(this);
        this.debug = this.debug.bind(this);
    }

    private formatMessage(
        level: LogLevel,
        message: string,
        tag?: string,
    ): { text: string; style: string; ansiText: string } {
        try {
            const timestamp = new Date().toLocaleTimeString();
            const tagStr = tag ? `[${tag}]` : '';
            const traceStr = this.context.traceId ? `(#${this.context.traceId})` : '';
            const categoryStr = this.context.category ? `[${this.context.category}]` : '';

            // Texto base sin colores (para logs planos o fallback)
            // Filtramos elementos vacíos y unimos con un solo espacio
            const plainText = [timestamp, categoryStr, traceStr, tagStr, message]
                .filter(Boolean)
                .join(' ');

            // Browser styling (%c)
            const color = tag ? generateColorFromTag(tag) : LEVEL_COLORS[level];
            const style = `color: ${color}; font-weight: bold; font-size: 11px;`;

            // Terminal styling (ANSI)
            const levelColor = ANSI_COLORS[level];
            const tagColor = tag ? getAnsiColorFromTag(tag) : levelColor;

            const ansiTagStr = tag ? `${tagColor}[${tag}]${ANSI_COLORS.reset}` : '';
            const ansiTraceStr = this.context.traceId ? `\x1b[94m(#${this.context.traceId})\x1b[0m` : '';
            const ansiCategoryStr = this.context.category ? `\x1b[35m[${this.context.category}]\x1b[0m` : '';

            // Construimos el log con colores ANSI
            const ansiText = [
                timestamp,
                ansiCategoryStr,
                ansiTraceStr,
                ansiTagStr,
                message
            ].filter(Boolean).join(' ');

            return { text: plainText, style, ansiText };
        } catch (e) {
            return {
                text: `[FORMAT ERROR] ${message}`,
                style: '',
                ansiText: `[FORMAT ERROR] ${message}`
            };
        }
    }

    private serializeError(error: any): any {
        if (!error) return error;

        if (error instanceof Error) {
            return {
                name: error.name,
                message: error.message,
                stack: error.stack,
                ...(error as any), // Capturar propiedades adicionales de errores personalizados
            };
        }

        return error;
    }

    /**
     * Creates a scoped logger with a fixed tag.
     */
    withTag(tag: string) {
        return {
            info: (message: string, ...args: any[]) => this.info(message, tag, ...args),
            warn: (message: string, ...args: any[]) => this.warn(message, tag, ...args),
            error: (message: string, error?: any, ...args: any[]) => this.error(message, tag, error, ...args),
            debug: (message: string, ...args: any[]) => this.debug(message, tag, ...args),
            group: (message: string, ...args: any[]) => this.group(message, tag, ...args),
            groupCollapsed: (message: string, ...args: any[]) => this.groupCollapsed(message, tag, ...args),
            groupEnd: () => this.groupEnd(),
            withContext: (ctx: Partial<LogContext>) => this.withContext({ ...this.context, ...ctx }).withTag(tag),
        };
    }

    /**
     * Creates a new logger instance with the given context merged with current context.
     */
    withContext(context: Partial<LogContext>): Logger {
        return new Logger({ ...this.context, ...context });
    }

    info(message: string, tag?: string, ...args: any[]) {
        if (__DEV__) {
            try {
                const { style, text, ansiText } = this.formatMessage('info', message, tag);
                if (useBrowserFormatting) {
                    console.log(`%c${text}`, style, ...args);
                } else {
                    console.log(ansiText, ...args);
                }
            } catch (e) {
                console.error('Logger internal error during info:', e);
            }
        } else {
            console.log(this.formatMessage('info', message, tag).text, ...args);
        }
    }

    warn(message: string, tag?: string, ...args: any[]) {
        if (__DEV__) {
            try {
                const { style, text, ansiText } = this.formatMessage('warn', message, tag);
                if (useBrowserFormatting) {
                    console.log(`%c${text}`, style, ...args);
                } else {
                    console.log(ansiText, ...args);
                }
            } catch (e) {
                console.error('Logger internal error during warn:', e);
            }
        } else {
            console.warn(this.formatMessage('warn', message, tag).text, ...args);
        }
    }

    error(message: string, tag?: string, error?: any, ...args: any[]) {
        if (__DEV__) {
            try {
                const serializedError = this.serializeError(error);
                const { style, text, ansiText } = this.formatMessage('error', message, tag);
                if (useBrowserFormatting) {
                    console.log(`%c${text}`, style, serializedError, ...args);
                } else {
                    console.log(ansiText, serializedError, ...args);
                }
            } catch (e) {
                console.error('Logger internal error during error:', e);
            }
        } else {
            const serializedError = this.serializeError(error);
            console.error(this.formatMessage('error', message, tag).text, serializedError, ...args);
        }
    }

    debug(message: string, tag?: string, ...args: any[]) {
        if (__DEV__) {
            try {
                const { style, text, ansiText } = this.formatMessage('debug', message, tag);
                if (useBrowserFormatting) {
                    console.log(`%c${text}`, style, ...args);
                } else {
                    console.log(ansiText, ...args);
                }
            } catch (e) {
                console.error('Logger internal error during debug:', e);
            }
        }
    }

    /**
     * Dumps all AsyncStorage content to the console.
     * Only works in development mode.
     */
    async debugStorage() {
        if (!__DEV__) return;

        try {
            const keys = await AsyncStorage.getAllKeys();
            const items = await AsyncStorage.multiGet(keys);

            this.info(`--- AsyncStorage Dump (${keys.length} keys) ---`, 'STORAGE');

            items.forEach(([key, value]) => {
                let parsedValue = value;
                try {
                    if (value) parsedValue = JSON.parse(value);
                } catch (e) {
                    // Not JSON, keep as string
                }

                console.log(`  🔑 ${key}:`, parsedValue);
            });

            this.info('--- End of AsyncStorage Dump ---', 'STORAGE');
        } catch (error) {
            this.error('Failed to dump AsyncStorage', 'STORAGE', error);
        }
    }

    /**
     * Creates a log group with collapsible content in the console.
     * Only works in development mode and browsers that support console.group.
     */
    group(message: string, tag?: string, ...args: any[]) {
        if (!__DEV__) return;

        try {
            const { style, text, ansiText } = this.formatMessage('info', message, tag);
            if (useBrowserFormatting) {
                console.group(`%c${text}`, style, ...args);
            } else {
                console.log('┌─ GROUP: ' + ansiText, ...args);
            }
        } catch (e) {
            console.error('Logger internal error during group:', e);
        }
    }

    /**
     * Creates a collapsed log group with collapsible content in the console.
     * Only works in development mode and browsers that support console.groupCollapsed.
     */
    groupCollapsed(message: string, tag?: string, ...args: any[]) {
        if (!__DEV__) return;

        try {
            const { style, text, ansiText } = this.formatMessage('info', message, tag);
            if (useBrowserFormatting) {
                console.groupCollapsed(`%c${text}`, style, ...args);
            } else {
                console.log('┌─ GROUP (collapsed): ' + ansiText, ...args);
            }
        } catch (e) {
            console.error('Logger internal error during groupCollapsed:', e);
        }
    }

    /**
     * Ends the current log group.
     * Only works in development mode.
     */
    groupEnd() {
        if (!__DEV__) return;

        try {
            if (useBrowserFormatting) {
                console.groupEnd();
            } else {
                console.log('└─ END GROUP');
            }
        } catch (e) {
            console.error('Logger internal error during groupEnd:', e);
        }
    }

    /**
     * Redirects standard console methods to use this logger.
     * Useful for capturing logs from 3rd party libraries or old code.
     */
    initGlobalCapture() {
        if (!__DEV__) return; // Only in dev to avoid performance issues in prod

        const originalConsoleError = console.error;
        console.error = (...args: any[]) => {
            // Avoid infinite loops if logger itself calls console.error
            if (args[0] && typeof args[0] === 'string' && args[0].includes('[ERROR]')) {
                originalConsoleError(...args);
                return;
            }
            this.error('Console error captured', 'CONSOLE', args[0], ...args.slice(1));
        };

        const originalConsoleWarn = console.warn;
        console.warn = (...args: any[]) => {
            if (args[0] && typeof args[0] === 'string' && args[0].includes('[WARN]')) {
                originalConsoleWarn(...args);
                return;
            }
            this.warn('Console warn captured', 'CONSOLE', ...args);
        };
    }
}

export const logger = new Logger();
export default logger;
