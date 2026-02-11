/**
 * Centralized logging utility for the Game-Reset application.
 * Provides consistent formatting and can be extended to send logs to external services.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
    constructor() {
        this.info = this.info.bind(this);
        this.warn = this.warn.bind(this);
        this.error = this.error.bind(this);
        this.debug = this.debug.bind(this);
    }

    private formatMessage(level: LogLevel, message: string, tag?: string): string {
        try {
            const timestamp = new Date().toISOString();
            const tagStr = tag ? `[${tag}]` : '';
            return `${timestamp} [${level.toUpperCase()}]${tagStr} ${message}`;
        } catch (e) {
            return `[FORMAT ERROR] ${message}`;
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

    info(message: string, tag?: string, ...args: any[]) {
        try {
            console.log(this.formatMessage('info', message, tag), ...args);
        } catch (e) {
            console.error('Logger internal error during info:', e);
        }
    }

    warn(message: string, tag?: string, ...args: any[]) {
        try {
            console.warn(this.formatMessage('warn', message, tag), ...args);
        } catch (e) {
            console.error('Logger internal error during warn:', e);
        }
    }

    error(message: string, tag?: string, error?: any, ...args: any[]) {
        try {
            const serializedError = this.serializeError(error);
            console.error(this.formatMessage('error', message, tag), serializedError, ...args);
        } catch (e) {
            console.error('Logger internal error during error:', e);
        }
    }

    debug(message: string, tag?: string, ...args: any[]) {
        if (__DEV__) {
            try {
                console.log(this.formatMessage('debug', message, tag), ...args);
            } catch (e) {
                console.error('Logger internal error during debug:', e);
            }
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
