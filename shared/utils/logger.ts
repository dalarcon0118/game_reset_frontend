/**
 * Centralized logging utility for the Game-Reset application.
 * Provides consistent formatting and can be extended to send logs to external services.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
    private formatMessage(level: LogLevel, message: string, tag?: string): string {
        const timestamp = new Date().toISOString();
        const tagStr = tag ? `[${tag}]` : '';
        return `${timestamp} [${level.toUpperCase()}]${tagStr} ${message}`;
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
        console.log(this.formatMessage('info', message, tag), ...args);
    }

    warn(message: string, tag?: string, ...args: any[]) {
        console.warn(this.formatMessage('warn', message, tag), ...args);
    }

    error(message: string, tag?: string, error?: any, ...args: any[]) {
        const serializedError = this.serializeError(error);
        console.error(this.formatMessage('error', message, tag), serializedError, ...args);
    }

    debug(message: string, tag?: string, ...args: any[]) {
        if (__DEV__) {
            console.log(this.formatMessage('debug', message, tag), ...args);
        }
    }
}

export const logger = new Logger();
export default logger;
