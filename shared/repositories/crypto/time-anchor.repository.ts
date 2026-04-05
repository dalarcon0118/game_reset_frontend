/**
 * Servicio Criptográfico: Time Anchor
 * 
 * Descarga y almacena el ancla temporal firmada por el backend.
 * Proporciona validación rigurosa de 'drift' (deriva) usando el reloj
 * monotónico (performance.now()) para detectar reinicios y manipulaciones
 * de hora por parte del usuario.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, Result, Either } from '../../core';
import { apiClient } from '../../services/api_client';
import { settings } from '../../../config/settings';
import { logger } from '../../utils/logger';
import { CRYPTO_KEYS, CRYPTO_LOG_TAGS, CRYPTO_MESSAGES, TIME_ANCHOR_ERRORS } from './constants';

const log = logger.withTag(CRYPTO_LOG_TAGS.TIME_ANCHOR);
const ANCHOR_KEY = CRYPTO_KEYS.TIME_ANCHOR;

export interface TimeAnchor {
    serverTime: number;
    signature: string;
    monotonicAtSync: number;
    validUntil: number;
    systemTimeAtSync: number; // Para cálculo de drift
}

export type TimeAnchorError = keyof typeof TIME_ANCHOR_ERRORS;

export class TimeAnchorRepository {

    /**
     * FASE 1 Zero Trust: Guarda el Time Anchor recibido en el Login.
     */
    static saveAnchor(data: { serverTime: number, signature: string, validUntil: number }): Task<Error, TimeAnchor> {
        return Task.fromPromise(async () => {
            const anchor: TimeAnchor = {
                serverTime: data.serverTime,
                signature: data.signature,
                validUntil: data.validUntil,
                monotonicAtSync: performance.now(),
                systemTimeAtSync: Date.now()
            };

            await AsyncStorage.setItem(ANCHOR_KEY, JSON.stringify(anchor));
            log.info('Time anchor from server login saved to AsyncStorage');

            return anchor;
        });
    }

    /**
     * Obtiene el ancla temporal desde el servidor y la guarda localmente.
     */
    static fetchAndStoreAnchor(): Task<Error, TimeAnchor> {
        return Task.fromPromise(async () => {
            const data: any = await apiClient.get(settings.api.endpoints.timeSignature());

            const anchor: TimeAnchor = {
                serverTime: data.serverTime,
                signature: data.signature,
                validUntil: data.validUntil,
                monotonicAtSync: performance.now(),
                systemTimeAtSync: Date.now()
            };

            await AsyncStorage.setItem(ANCHOR_KEY, JSON.stringify(anchor));
            log.debug(CRYPTO_MESSAGES.TIME_ANCHOR_SYNCED);

            return anchor;
        });
    }

    /**
     * Lee el ancla temporal del almacenamiento y valida su integridad.
     * Retorna Result (Síncrono) porque no realiza operaciones de red.
     */
    static getValidAnchor(): Task<TimeAnchorError, TimeAnchor> {
        return Task.create<TimeAnchorError, TimeAnchor>(async () => {
            const stored = await AsyncStorage.getItem(ANCHOR_KEY);

            // LOG: Verificar si existe anchor almacenado
            log.info(`[TIME_ANCHOR_CHECK] 🔍 Verificando time anchor almacenado...`);
            log.info(`[TIME_ANCHOR_CHECK] stored exists: ${!!stored}, length: ${stored?.length || 0}`);

            if (!stored) {
                log.error(`[TIME_ANCHOR_CHECK] ❌ NO_ANCHOR_FOUND: No hay time anchor almacenado. Se requiere sincronización previa.`);
                return Result.error(TIME_ANCHOR_ERRORS.NO_ANCHOR_FOUND);
            }

            try {
                const anchor: TimeAnchor = JSON.parse(stored);

                // LOG: Detalles del anchor cargado
                log.info(`[TIME_ANCHOR_CHECK] 📦 Anchor cargado:`, {
                    serverTime: anchor.serverTime,
                    validUntil: anchor.validUntil,
                    monotonicAtSync: anchor.monotonicAtSync,
                    systemTimeAtSync: anchor.systemTimeAtSync,
                    signature: anchor.signature?.substring(0, 16) + '...'
                });

                // 1. Expiración de 24 horas (Window check)
                const now = Date.now();
                const timeUntilExpiry = anchor.validUntil - now;
                const hoursUntilExpiry = (timeUntilExpiry / (1000 * 60 * 60)).toFixed(2);

                log.info(`[TIME_ANCHOR_CHECK] ⏰ Verificación de expiración:`, {
                    now,
                    validUntil: anchor.validUntil,
                    timeUntilExpiry,
                    hoursUntilExpiry: `${hoursUntilExpiry} horas`,
                    isExpired: now > anchor.validUntil
                });

                if (now > anchor.validUntil) {
                    log.error(`[TIME_ANCHOR_CHECK] ❌ ANCHOR_EXPIRED: El time anchor expiró hace ${Math.abs(parseFloat(hoursUntilExpiry))} horas. Se requiere nueva sincronización.`);
                    return Result.error(TIME_ANCHOR_ERRORS.ANCHOR_EXPIRED);
                }

                // 2. Validación de Reloj Monotónico (Detecta Reboots)
                const currentMonotonic = performance.now();
                const monotonicDelta = currentMonotonic - anchor.monotonicAtSync;

                log.info(`[TIME_ANCHOR_CHECK] 🔄 Verificación de reloj monotónico:`, {
                    currentMonotonic,
                    anchorMonotonicAtSync: anchor.monotonicAtSync,
                    monotonicDelta,
                    isReboot: monotonicDelta < 0
                });

                if (monotonicDelta < 0) {
                    log.error(`[TIME_ANCHOR_CHECK] ❌ REBOOT_DETECTED: Reloj monotónico retrocedió ${monotonicDelta}ms. El dispositivo fue reiniciado.`);
                    return Result.error(TIME_ANCHOR_ERRORS.REBOOT_DETECTED);
                }

                // 3. Validación de Drift (Cambio manual de hora en OS)
                // Comparamos cuánto avanzó el reloj del sistema vs cuánto avanzó el monotónico
                const systemDelta = Date.now() - anchor.systemTimeAtSync;
                const drift = Math.abs(systemDelta - monotonicDelta);

                log.info(`[TIME_ANCHOR_CHECK] 🕐 Verificación de drift de reloj:`, {
                    systemTimeAtSync: anchor.systemTimeAtSync,
                    currentSystemTime: Date.now(),
                    systemDelta,
                    monotonicDelta,
                    drift,
                    driftThreshold: 60000,
                    isDriftDetected: drift > 60000
                });

                // Si el drift es mayor a 60 segundos (margen amplio para sleep del OS)
                // significa que el usuario cambió la hora manualmente mientras estaba offline.
                if (drift > 60000) {
                    log.error(`[TIME_ANCHOR_CHECK] ❌ DRIFT_DETECTED: Drift de ${drift}ms detectado. Posible manipulación de reloj.`);
                    return Result.error(TIME_ANCHOR_ERRORS.DRIFT_DETECTED);
                }

                // LOG: Éxito
                log.info(`[TIME_ANCHOR_CHECK] ✅ Time anchor válido. Listo para generar fingerprint.`);
                return Result.ok(anchor);

            } catch (e) {
                log.error(`[TIME_ANCHOR_CHECK] ❌ NO_ANCHOR_FOUND: Error parseando anchor almacenado`, e);
                return Result.error(TIME_ANCHOR_ERRORS.NO_ANCHOR_FOUND);
            }
        });
    }
}
