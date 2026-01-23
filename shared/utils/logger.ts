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
}

export const logger = new Logger();
export default logger;
