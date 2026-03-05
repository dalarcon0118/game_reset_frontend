import {
    LogEvent,
    LogFormatterResult,
    ILogFormatter,
    LogLevel,
    LogCategory
} from './logger.types';

/**
 * SRP: This class is only responsible for formatting LogEvents into strings/ANSI/styles.
 */

const LEVEL_COLORS: Record<LogLevel, string> = {
    info: '#4ECDC4',
    warn: '#F39C12',
    error: '#E74C3C',
    debug: '#95A5A6',
};

const ANSI_COLORS: Record<LogLevel | 'reset' | 'trace' | 'category' | 'tag', string> = {
    info: '\x1b[36m',     // Cyan
    warn: '\x1b[33m',     // Yellow
    error: '\x1b[31m',    // Red
    debug: '\x1b[90m',    // Gray
    trace: '\x1b[94m',    // Light Blue
    category: '\x1b[35m', // Magenta
    tag: '\x1b[32m',      // Green
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

export class LogFormatter implements ILogFormatter {
    format(event: LogEvent): LogFormatterResult {
        const { timestamp, level, message, context } = event;
        const timeStr = timestamp.toLocaleTimeString([], { hour12: false });

        const tagStr = context.tag ? `[${context.tag}]` : '';
        const traceStr = context.traceId ? `(#${context.traceId})` : '';
        const categoryStr = context.category ? `[${context.category}]` : '';
        const storeStr = context.storeId ? `[${context.storeId}]` : '';

        // 1. Plain Text (for files and basic fallback)
        // Format: timestamp [category] (#traceId) [tag] message [storeId]
        const plainText = [
            timeStr,
            categoryStr,
            traceStr,
            tagStr,
            message,
            storeStr
        ].filter(Boolean).join(' ');

        // 2. ANSI Text (for terminal/Metro)
        const levelColor = ANSI_COLORS[level];
        const tagColor = context.tag ? this.getAnsiColorFromTag(context.tag) : levelColor;

        const ansiTraceStr = context.traceId ? `${ANSI_COLORS.trace}(#${context.traceId})${ANSI_COLORS.reset}` : '';
        const ansiCategoryStr = context.category ? `${ANSI_COLORS.category}[${context.category}]${ANSI_COLORS.reset}` : '';
        const ansiTagStr = context.tag ? `${tagColor}[${context.tag}]${ANSI_COLORS.reset}` : '';
        const ansiStoreStr = context.storeId ? `\x1b[93m[${context.storeId}]\x1b[0m` : '';

        const ansiText = [
            timeStr,
            ansiCategoryStr,
            ansiTraceStr,
            ansiTagStr,
            message,
            ansiStoreStr
        ].filter(Boolean).join(' ');

        // 3. Browser Styled Text
        const color = context.tag ? this.generateColorFromTag(context.tag) : LEVEL_COLORS[level];
        const style = `color: ${color}; font-weight: bold; font-size: 11px;`;

        return {
            text: plainText,
            ansiText: ansiText,
            styledText: `%c${plainText}`,
            styles: [style]
        };
    }

    private generateColorFromTag(tag: string): string {
        let hash = 0;
        for (let i = 0; i < tag.length; i++) {
            hash = tag.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = Math.abs(hash % 360);
        const s = 70 + (Math.abs(hash) % 20);
        const l = 45 + (Math.abs(hash) % 20);
        return this.hslToHex(h, s, l);
    }

    private hslToHex(h: number, s: number, l: number): string {
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

    private getAnsiColorFromTag(tag: string): string {
        let hash = 0;
        for (let i = 0; i < tag.length; i++) {
            hash = tag.charCodeAt(i) + ((hash << 5) - hash);
        }
        return ANSI_TAG_COLORS[Math.abs(hash) % ANSI_TAG_COLORS.length];
    }
}
