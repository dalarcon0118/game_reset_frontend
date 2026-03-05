// Servicio para manejar rangos de tiempo - Lógica pura
export class TimeRangeService {
  /**
   * Obtiene el rango de tiempo para el día actual
   */
  getTodayRange(nowMs?: number): { start: number; end: number } {
    const now = nowMs ? new Date(nowMs) : new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const end = start + 24 * 60 * 60 * 1000;
    
    return { start, end };
  }

  /**
   * Verifica si un timestamp está dentro de un rango
   */
  isWithinRange(timestamp: number, start: number, end: number): boolean {
    return timestamp >= start && timestamp < end;
  }

  /**
   * Filtra un array de items por rango de tiempo
   */
  filterByTimeRange<T extends { timestamp: number }>(
    items: T[], 
    start: number, 
    end: number
  ): T[] {
    return items.filter(item => this.isWithinRange(item.timestamp, start, end));
  }
}