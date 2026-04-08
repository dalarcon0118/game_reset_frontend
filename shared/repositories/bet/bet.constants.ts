/**
 * Constantes y Textos para el Módulo de Apuestas (Bet)
 */

export const BET_KEYS = {
    STORAGE_ENTITY: 'bet',
    STORAGE_STATUS_PENDING: 'pending',
    STORAGE_DATA_TYPE: 'data',
    STORAGE_KEY_TOTAL_SALES: 'total_sales',
};

export const BET_LOG_TAGS = {
    REPOSITORY: 'BetRepository',
    OFFLINE_ADAPTER: 'BetOfflineAdapter',
    API_ADAPTER: 'BetApiAdapter',
    PLACE_FLOW: 'PlaceBetFlow',
    SYNC_STRATEGY: 'BET_SYNC_STRATEGY',
    SYNC_LISTENER: 'BetSyncListener',
    NOTIFICATION: 'BET-NOTIFICATION',
};

export const BET_LOGS = {
    // Repository
    GET_BETS_TIMEOUT: 'Tiempo de espera agotado en getBets, retornando error',
    FINANCIAL_SUMMARY_CALLED: 'getFinancialSummary llamado',
    FINANCIAL_SUMMARY_RESOLVED: 'getFinancialSummary resuelto',
    FINANCIAL_SUMMARY_TIMEOUT: 'Tiempo de espera agotado en getFinancialSummary',
    DRAW_CLOSED: 'Este sorteo ya ha cerrado',



    // Offline Adapter
    SAVING_BET: 'Guardando apuesta',
    SAVING_BATCH: 'Guardando lote de apuestas (Upsert Mode)',
    UPSERT_CLEANUP: 'Upsert: Eliminando entradas temporales obsoletas',
    RECOVERING_ALL: 'Recuperando todas las apuestas del almacenamiento...',
    DEDUP_STATS: 'Deduplicación realizada',
    PENDING_RECOVERY: 'Recuperando apuestas pendientes (pending, error, blocked)...',
    PENDING_FOUND: 'Encontradas apuestas pendientes en orden FIFO.',
    STATUS_RECOVERY: 'Recuperando apuestas por estado',
    UPDATE_STATUS: 'Actualizando estado de apuesta',
    UPDATE_NOT_FOUND: 'No se encontró apuesta para actualizar',

    // Flow & Business Rules
    TIME_FRAUD_DETECTED: 'FRAUDE_TIEMPO: Anomalía detectada en el reloj.',
    APP_BLOCKED: 'APUESTA_BLOQUEADA: Sincronización requerida.',
    INVALID_AMOUNT: 'ERROR_CRITICO: Monto inválido.',
    REQUIRED_STRUCTURE: 'ERROR_CRITICO: Estructura obligatoria.',
    SIGN_ERROR: 'Error de firma',

    // Notifications
    NOTIF_SAVED_TITLE: 'Apuesta Guardada',
    NOTIF_SAVED_MESSAGE: (code: string, drawId: string, amount: number) =>
        `Apuesta ${code} (RD$${amount}) guardada localmente. Sorteo #${drawId}. Se sincronizará cuando haya conexión.`,
    NOTIF_CREATING: 'Creando notificación pendiente para apuesta',
    NOTIF_SUCCESS: 'Notificación pendiente creada exitosamente para',
    NOTIF_FAILED: 'Fallo al crear notificación pendiente para',
    NOTIF_SYNC_SUCCESS_MSG: (breakdown: Record<string, number>) => {
        const bet = breakdown['bet'] ?? 0;
        const notification = breakdown['notification'] ?? 0;
        const parts: string[] = [];
        if (bet > 0) parts.push(`${bet} apuesta${bet > 1 ? 's' : ''}`);
        if (notification > 0) parts.push(`${notification} notificación${notification > 1 ? 'es' : ''}`);
        if (parts.length === 0) return 'Sincronización completada.';
        return `${parts.join(' y ')} sincronizada${parts.length === 1 ? '' : 's'} con el servidor.`;
    },
    NOTIF_SYNC_SUCCESS_TITLE: 'Sincronización exitosa',
    NOTIF_SYNC_ERROR_MSG: (breakdown: Record<string, number>) => {
        const bet = breakdown['bet'] ?? 0;
        const notification = breakdown['notification'] ?? 0;
        const parts: string[] = [];
        if (bet > 0) parts.push(`${bet} apuesta${bet > 1 ? 's' : ''}`);
        if (notification > 0) parts.push(`${notification} notificación${notification > 1 ? 'es' : ''}`);
        if (parts.length === 0) return 'Algunos ítems no se pudieron sincronizar. Se reintentará más tarde.';
        return `${parts.join(' y ')} no se${parts.length === 1 ? ' pudo' : ' pudieron'} sincronizar. Se reintentará más tarde.`;
    },
    NOTIF_SYNC_ERROR_TITLE: 'Error de sincronización',
    NOTIF_SYNC_SUCCESS_DETAIL: (code: string, drawId: string, amount: number) =>
        `Apuesta ${code} (RD$${amount}) sincronizada al sorteo #${drawId}.`,
    NOTIF_SYNC_ERROR_DETAIL: (code: string, drawId: string, reason: string) =>
        `Apuesta ${code} (sorteo #${drawId}) no se pudo sincronizar. Razón: ${reason}. Se reintentará automáticamente.`,

    // Sync
    SYNC_PUSHING_BATCH: 'Sincronizando lote de apuestas',
    SYNC_ALREADY_SYNCED: 'Apuesta ya sincronizada en el servidor.',
    SYNC_NO_DATA: 'No se encontraron datos en el item de sincronización',
    SYNC_ERROR: 'Error en la sincronización de apuesta',
    SYNC_GENERAL_ERROR: 'Error general en la sincronización del lote',

    // API Adapter
    API_SENDING_BET: 'Enviando apuesta',
    API_DECODE_FAILED: 'Fallo en la decodificación de datos',
    API_LIST_BETS_DEBUG: 'Listar apuestas con filtros',
    API_FETCH_ERROR: 'Error al obtener apuestas desde el servidor',
    API_REPORT_DLQ: 'Reportando apuesta a DLQ',
};

export const BET_VALUES = {
    GET_BETS_TIMEOUT_MS: 8000,
    FINANCIAL_SUMMARY_TIMEOUT_MS: 8000,
    RECENT_MAX_AGE_MS: 60 * 60 * 1000, // 1 hour
    CLEANUP_DAYS_DEFAULT: 7,
};
