/**
 * Centralized types for the logging system.
 * Following SRP: This file only defines the data structures.
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export type LogCategory = 'BUSINESS' | 'INFRA' | 'NETWORK' | 'UI' | 'CORE';

export type LogImportance = 'HIGH' | 'LOW';

export interface LogContext {
    traceId?: string;
    category?: LogCategory;
    importance?: LogImportance;
    tag?: string;
    storeId?: string;
    [key: string]: any;
}

export interface LogEvent {
    timestamp: Date;
    level: LogLevel;
    message: string;
    context: LogContext;
    args?: any[];
    error?: any;
}

export interface LogFormatterResult {
    text: string;      // Plain text for file logs
    styledText?: string; // Browser-styled text (%c)
    styles?: string[];   // Browser styles
    ansiText?: string;   // Terminal-styled text (ANSI)
}

export interface ILogFormatter {
    format(event: LogEvent): LogFormatterResult;
}
