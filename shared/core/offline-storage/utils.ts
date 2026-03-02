// Utilidades para gestión de claves y namespaces del almacenamiento offline

import {
  OfflineStorageVersion,
  StorageNamespace
} from './types';

export class OfflineStorageKeyManager {
  private static readonly VERSION: OfflineStorageVersion = 'v2';
  private static readonly SEPARATOR = ':';

  /**
   * Genera una clave siguiendo el patrón de 5 niveles:
   * @<version>:<namespace>:<entity>:<id>:<subresource>
   */
  static generateKey(
    namespace: StorageNamespace,
    entity: string,
    id: string = 'global',
    subresource: string = 'data'
  ): string {
    return `@${this.VERSION}${this.SEPARATOR}${namespace}${this.SEPARATOR}${entity}${this.SEPARATOR}${id}${this.SEPARATOR}${subresource}`;
  }

  /**
   * Genera un patrón para búsqueda (Redis-like)
   */
  static getPattern(
    namespace: StorageNamespace,
    entity?: string,
    id?: string,
    subresource?: string
  ): string {
    const parts = [`@${this.VERSION}`, namespace];

    if (entity) parts.push(entity);
    else return parts.join(this.SEPARATOR) + ':*';

    if (id) parts.push(id);
    else return parts.join(this.SEPARATOR) + ':*';

    if (subresource) parts.push(subresource);
    else return parts.join(this.SEPARATOR) + ':*';

    return parts.join(this.SEPARATOR);
  }

  /**
   * Parsea una clave en sus componentes
   */
  static parseKey(key: string) {
    const parts = key.split(this.SEPARATOR);
    if (parts.length !== 5 || !parts[0].startsWith('@')) return null;

    return {
      version: parts[0].substring(1),
      namespace: parts[1] as StorageNamespace,
      entity: parts[2],
      id: parts[3],
      subresource: parts[4]
    };
  }
}

// Utilidades para operaciones de almacenamiento
export class OfflineStorageUtils {

  // Generar checksum para validar integridad
  static generateChecksum(data: any): string {
    const str = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Normalizar timestamps
  static normalizeTimestamp(timestamp: string | number): string {
    if (typeof timestamp === 'number') {
      return new Date(timestamp).toISOString();
    }
    return timestamp;
  }

  // Crear índices para búsquedas eficientes
  static createIndex<T>(items: T[], keyExtractor: (item: T) => string): Record<string, T> {
    return items.reduce((index, item) => {
      const key = keyExtractor(item);
      index[key] = item;
      return index;
    }, {} as Record<string, T>);
  }
}

// Utilidades para migración
export class OfflineStorageMigrationUtils {

  // Mapeo de claves antiguas a nuevas
  static readonly KEY_MAPPING: Record<string, (oldKey: string) => string> = {
    '@bet_types': (oldKey) => {
      const match = oldKey.match(/@bet_types:(\d+)/);
      return match ? OfflineStorageKeyManager.generateKey('draw', 'bet_type', match[1]) : oldKey;
    },
    '@draw_financial_states': () => {
      return '@v2:draw:instance:financial:data';
    },
    '@pending_bets_v2': () => {
      return '@v2:bet:pending:list:data';
    },
    '@draws': () => {
      return '@v2:draw:instance:list:data';
    },
    '@rules': () => {
      return '@v2:rules:validation:list:data';
    }
  };

  // Detectar tipo de clave antigua
  static detectOldKeyType(key: string): string | null {
    for (const [prefix, mapper] of Object.entries(this.KEY_MAPPING)) {
      if (key.startsWith(prefix)) {
        return mapper(key);
      }
    }
    return null;
  }

  // Transformar datos antiguos a nuevo formato
  static transformOldBetType(oldData: any): any {
    return {
      id: oldData.id?.toString() || '',
      name: oldData.name || '',
      code: oldData.code || '',
      description: oldData.description || null,
      validationRules: oldData.validation_rules || [],
      rewardRules: oldData.reward_rules || [],
      drawTypeId: oldData.draw_type?.toString() || '',
      winningRuleId: oldData.winning_rule?.toString() || '',
      createdAt: oldData.created_at || new Date().toISOString(),
      updatedAt: oldData.updated_at || new Date().toISOString()
    };
  }

  static transformOldPendingBet(oldData: any): any {
    return {
      offlineId: oldData.offlineId || '',
      receiptCode: oldData.data?.receiptCode || '',
      drawId: oldData.data?.drawId || '',
      structureId: oldData.data?.owner_structure?.toString() || '',
      bets: (oldData.data?.loteria || []).map((bet: any) => ({
        id: bet.id || '',
        numbers: bet.bet || '',
        amount: bet.amount || 0,
        betTypeId: bet.betTypeid?.toString() || ''
      })),
      status: oldData.status === 'synced' ? 'synced' : 'pending',
      amount: oldData.amount || oldData.data?.loteria?.reduce((sum: number, bet: any) => sum + (bet.amount || 0), 0) || 0,
      createdAt: oldData.timestamp ? new Date(oldData.timestamp).toISOString() : new Date().toISOString(),
      syncedAt: oldData.status === 'synced' ? new Date().toISOString() : undefined
    };
  }
}