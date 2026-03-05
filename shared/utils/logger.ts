import {
    LogContext,
    LogEvent,
    LogLevel,
    LogCategory,
    ILogFormatter
} from './logger.types';
import { LogFormatter } from './logger.formatter';

/**
 * SRP: This class is a Facade that coordinates the formatter and the output (console).
 * It manages context propagation and filtering.
 */

const isBrowser = typeof document !== 'undefined';
const isRemoteDebugger = typeof window !== 'undefined' && !!(window as any).chrome;
const useBrowserFormatting = isBrowser || isRemoteDebugger;

export class Logger {
    private context: LogContext;
    private formatter: ILogFormatter;

    constructor(context: LogContext = {}, formatter: ILogFormatter = new LogFormatter()) {
        this.context = context;
        this.formatter = formatter;
    }

    /**
     * Creates a new logger instance with the given context merged with current context.
     */
    withContext(context: Partial<LogContext>): Logger {
        return new Logger({ ...this.context, ...context }, this.formatter);
    }

    /**
     * Creates a scoped logger with a fixed tag.
     */
    withTag(tag: string): Logger {
        return this.withContext({ tag });
    }

    /**
     * Creates a scoped logger with a store ID.
     */
    withStore(storeId: string) {
        return this.withContext({ storeId });
    }

    info(message: string, ...args: any[]) {
        this.log('info', message, args);
    }

    warn(message: string, ...args: any[]) {
        this.log('warn', message, args);
    }

    error(message: string, error?: any, ...args: any[]) {
        this.log('error', message, args, error);
    }

    debug(message: string, ...args: any[]) {
        if (__DEV__) {
            this.log('debug', message, args);
        }
    }

    // Helper for TEA groups (works in terminal and browser)
    group(label: string, ...args: any[]) {
        if (!__DEV__) return;

        const event: LogEvent = {
            timestamp: new Date(),
            level: 'info',
            message: label,
            context: this.context,
            args: args
        };

        const formatted = this.formatter.format(event);

        if (useBrowserFormatting) {
            console.group(formatted.styledText, ...formatted.styles!, ...args);
        } else {
            console.log(formatted.ansiText || formatted.text, ...args);
        }
    }

    groupCollapsed(label: string, ...args: any[]) {
        if (!__DEV__) return;

        const event: LogEvent = {
            timestamp: new Date(),
            level: 'info',
            message: label,
            context: this.context,
            args: args
        };

        const formatted = this.formatter.format(event);

        if (useBrowserFormatting) {
            console.groupCollapsed(formatted.styledText, ...formatted.styles!, ...args);
        } else {
            console.log(formatted.ansiText || formatted.text, ...args);
        }
    }

    groupEnd() {
        if (__DEV__ && useBrowserFormatting) {
            console.groupEnd();
        }
    }

    private log(level: LogLevel, message: string, args: any[], error?: any) {
        try {
            const event: LogEvent = {
                timestamp: new Date(),
                level,
                message,
                context: this.context,
                args,
                error
            };

            const formatted = this.formatter.format(event);

            // Output to console
            if (useBrowserFormatting) {
                const consoleMethod = level === 'debug' ? 'log' : level;
                if (error) {
                    console[consoleMethod](formatted.styledText, ...formatted.styles!, this.serializeError(error), ...args);
                } else {
                    console[consoleMethod](formatted.styledText, ...formatted.styles!, ...args);
                }
            } else {
                // Node.js / Terminal (Metro)
                const output = formatted.ansiText || formatted.text;
                if (error) {
                    console.log(output, this.serializeError(error), ...args);
                } else {
                    console.log(output, ...args);
                }
            }
        } catch (e) {
            // Fallback in case of logging error
            console.error('[LOGGER_ERROR]', e, message);
        }
    }

    private serializeError(error: any): any {
        if (!error) return error;
        if (error instanceof Error) {
            return {
                name: error.name,
                message: error.message,
                stack: error.stack,
                ...(error as any),
            };
        }
        return error;
    }
}

// Fallback no-op functions
const noop = () => { };

// Create a safe logger instance that never fails
let loggerInstance: any;

try {
    loggerInstance = new Logger();
} catch (e) {
    // If Logger fails, create a minimal working logger
    console.warn('[Logger] Failed to initialize Logger, using fallback');
    loggerInstance = {
        withTag: (tag: string) => loggerInstance,
        withContext: (ctx: any) => loggerInstance,
        withStore: (id: string) => loggerInstance,
        info: (msg: string, ...args: any[]) => console.log(`[INFO] ${msg}`, ...args),
        warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${msg}`, ...args),
        error: (msg: string, err?: any, ...args: any[]) => console.error(`[ERROR] ${msg}`, err, ...args),
        debug: (msg: string, ...args: any[]) => { if (__DEV__) console.log(`[DEBUG] ${msg}`, ...args); },
        group: noop,
        groupCollapsed: noop,
        groupEnd: noop,
    };
}

// Wrap the logger to ensure all methods are always available
const safeLogger = {
    get withTag() { return loggerInstance.withTag.bind(loggerInstance); },
    get withContext() { return loggerInstance.withContext.bind(loggerInstance); },
    get withStore() { return loggerInstance.withStore.bind(loggerInstance); },
    get info() { return loggerInstance.info.bind(loggerInstance); },
    get warn() { return loggerInstance.warn.bind(loggerInstance); },
    get error() { return loggerInstance.error.bind(loggerInstance); },
    get debug() { return loggerInstance.debug.bind(loggerInstance); },
    get group() { return loggerInstance.group.bind(loggerInstance); },
    get groupCollapsed() { return loggerInstance.groupCollapsed.bind(loggerInstance); },
    get groupEnd() { return loggerInstance.groupEnd.bind(loggerInstance); },
};

export const logger = safeLogger as Logger;
export default logger;
export type { LogContext, LogCategory };
