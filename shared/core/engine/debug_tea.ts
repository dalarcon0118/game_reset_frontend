/**
 * TEA Debug Logger
 * Herramienta de diagnóstico para rastrear flujo TEA y detectar ciclos infinitos
 */

interface DebugLogEntry {
  timestamp: string;
  component: string;
  event: string;
  data?: any;
  stackTrace?: string;
}

class TEADebugLogger {
  private logs: DebugLogEntry[] = [];
  private maxLogs = 1000;
  private enabled = true;

  private formatTimestamp(): string {
    return new Date().toISOString().split('T')[1].replace('Z', ''); // HH:MM:SS.ms
  }

  private captureStackTrace(): string {
    try {
      throw new Error();
    } catch (e: any) {
      return e.stack.split('\n').slice(3, 6).join('\n'); // 3 frames de stack
    }
  }

  log(component: string, event: string, data?: any): void {
    if (!this.enabled) return;

    const entry: DebugLogEntry = {
      timestamp: this.formatTimestamp(),
      component,
      event,
      data: this.sanitizeData(data),
    };

    // Solo agregar stack trace para eventos críticos
    if (event.includes('ERROR') || event.includes('LOOP')) {
      entry.stackTrace = this.captureStackTrace();
    }

    this.logs.push(entry);

    // Mantener solo últimos N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console con formato
    console.log(`[${entry.timestamp}] [${component}] ${event}`, data ? data : '');
  }

  private sanitizeData(data: any): any {
    if (data === null || data === undefined) return data;
    if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') return data;
    if (Array.isArray(data)) return `[Array(${data.length})]`;
    if (typeof data === 'object') {
      // Sanitize RemoteData objects (pueden ser muy grandes)
      if (data._tag === 'RemoteData') {
        return {
          _tag: data._tag,
          type: Object.keys(data)[1], // notAsked | loading | failure | success
          hasData: data.value !== undefined
        };
      }
      if (data.type) return { type: data.type, payload: data.payload ? '[payload]' : undefined };
      return `[Object(${Object.keys(data).length} keys)]`;
    }
    return '[unknown]';
  }

  getLogs(): DebugLogEntry[] {
    return [...this.logs];
  }

  exportToFile(): string {
    const header = `=== TEA Debug Log Export ===\n` +
      `Generated: ${new Date().toISOString()}\n` +
      `Total Entries: ${this.logs.length}\n` +
      `===========================\n\n`;

    const formatted = this.logs
      .map(entry => {
        let line = `[${entry.timestamp}] [${entry.component}] ${entry.event}`;
        if (entry.data) line += ` ${JSON.stringify(entry.data)}`;
        if (entry.stackTrace) line += `\n  Stack:\n${entry.stackTrace.split('\n').map(s => `    ${s}`).join('\n')}`;
        return line;
      })
      .join('\n');

    return header + formatted;
  }

  clear(): void {
    this.logs = [];
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// Instancia global
export const teaDebugLogger = new TEADebugLogger();

// Helpers para componentes específicos
export const debugTeaModule = (event: string, data?: any) => teaDebugLogger.log('TEA_MODULE', event, data);
export const debugEngine = (event: string, data?: any) => teaDebugLogger.log('ENGINE', event, data);
export const debugWinningScreen = (event: string, data?: any) => teaDebugLogger.log('WINNING_SCREEN', event, data);
export const debugWinningProvider = (event: string, data?: any) => teaDebugLogger.log('WINNING_PROVIDER', event, data);
export const debugUpdate = (event: string, data?: any) => teaDebugLogger.log('UPDATE', event, data);
