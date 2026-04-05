/**
 * Orquestador Criptográfico: Fingerprint Service
 * 
 * Combina el Device Secret, Time Anchor y Hash Chain para generar
 * una firma inmutable para cada apuesta (Fingerprint).
 * Implementa mitigación contra Divergencia de Serialización (Riesgo 4).
 */

import * as Crypto from 'expo-crypto';
import { Task, Result } from '../../core';
import { DeviceSecretRepository } from './device-secret.repository';
import { TimeAnchorRepository, TimeAnchorError, TimeAnchor } from './time-anchor.repository';
import { logger } from '../../utils/logger';
import { CRYPTO_LOG_TAGS, CRYPTO_VALUES } from './constants';

const log = logger.withTag(CRYPTO_LOG_TAGS.FINGERPRINT);

export interface FingerprintPayload {
    hash: string;
    version: number;
    chainHash?: string;
    total_sales?: string;
    raw_payload: string;
}

// Representación parcial de los datos necesarios de una apuesta para firmar
export interface BetSignData {
    userId: number;
    structureId: number;
    drawId: number;
    betTypeId: number;
    numbers: string[];
    amount: number;
    totalSales: number; // V2: Balance Acumulado
    timestamp: number;
}

export class FingerprintRepository {

    /**
     * Orquesta la generación del Fingerprint completo para una apuesta.
     * Zero Trust V2: Usa Running Balance y Secreto del Servidor.
     */
    static signBet(betData: BetSignData): Task<Error | TimeAnchorError, FingerprintPayload> {
        // Zero Trust: Validar que el userId sea válido antes de firmar
        if (!betData.userId || betData.userId === 0) {
            log.error(`[FINGERPRINT_SIGN_V2] ❌ Error: Intento de firma con userId inválido (0)`);
            return Task.fail(new Error('INVALID_USER_ID_FOR_SIGNATURE'));
        }

        log.info(`[FINGERPRINT_SIGN_V2] 🎯 Iniciando firma de apuesta:`, {
            userId: betData.userId,
            drawId: betData.drawId,
            amount: betData.amount,
            totalSales: betData.totalSales,
            timestamp: betData.timestamp
        });

        // 1. Validar y obtener Time Anchor (Síncrono/Puro)
        log.info(`[FINGERPRINT_SIGN_V2] 🕒 Obteniendo Time Anchor...`);
        return TimeAnchorRepository.getValidAnchor()
            .mapError(e => {
                log.error(`[FINGERPRINT_SIGN] ❌ Error obteniendo time anchor: ${e}`);
                return e as Error | TimeAnchorError;
            })
            .andThen(anchor => {
                // 2. Obtener Secreto del Servidor (Daily Secret)
                log.info(`[FINGERPRINT_SIGN_V2] 🔑 Obteniendo Secreto del Servidor...`);
                return DeviceSecretRepository.getSecret()
                    .mapError(e => {
                        log.error(`[FINGERPRINT_SIGN] ❌ Error obteniendo secreto del servidor: ${e}`);
                        return e as Error | TimeAnchorError;
                    })
                    .andThen(secret => {
                        // 3. Serializar determinísticamente con Running Balance (Raw Payload)
                        log.info(`[FINGERPRINT_SIGN_V2] 📦 Generando Payload Canónico... balance=${betData.totalSales}`);
                        return this.createCanonicalPayload(betData, anchor)
                            .mapError(e => {
                                log.error(`[FINGERPRINT_SIGN] ❌ Error creando payload canónico: ${e}`);
                                return e as Error | TimeAnchorError;
                            })
                            .andThen(rawPayload => {
                                // 4. Firmar con HMAC-SHA256 usando el secreto del servidor
                                log.info(`[FINGERPRINT_SIGN_V2] ✍️ Firmando con HMAC-SHA256...`);
                                return this.generateHMAC(secret, betData, rawPayload)
                                    .mapError(e => {
                                        log.error(`[FINGERPRINT_SIGN] ❌ Error generando HMAC: ${e}`);
                                        return e as Error | TimeAnchorError;
                                    })
                                    .map(hmac => {
                                        log.info(`[FINGERPRINT_SIGN] ✅ Fingerprint V2 generado exitosamente`);
                                        return {
                                            hash: hmac,
                                            version: CRYPTO_VALUES.VERSION,
                                            total_sales: betData.totalSales.toFixed(2),
                                            raw_payload: rawPayload
                                        };
                                    });
                            });
                    });
            });
    }

    // --- Operaciones Puras --- //

    /**
     * Mitigación Riesgo 4: Serialización estricta en JS.
     * Genera un string raw que el backend verificará byte-por-byte.
     * Zero Trust V2: Incluye UID y Running Balance.
     */
    private static createCanonicalPayload(betData: BetSignData, anchor: TimeAnchor): Task<Error, string> {
        return Task.fromSync(() => {
            const payloadObj = {
                v: CRYPTO_VALUES.VERSION,
                uid: betData.userId,
                sid: betData.structureId,
                did: betData.drawId,
                bid: betData.betTypeId,
                nums: [...betData.numbers].sort(), // Orden determinista
                amt: betData.amount.toFixed(2),
                total_sales: betData.totalSales.toFixed(2), // V2: Running Balance
                ts: betData.timestamp,
                anchor_sig: anchor.signature, // V2: Firma simplificada del servidor
                nonce: Crypto.randomUUID()
            };

            // JSON.stringify en JS es determinista en el orden de inserción de las llaves
            return JSON.stringify(payloadObj, (key, value) => value, 0);
        });
    }

    /**
     * Genera el HMAC-SHA256 usando una llave derivada (HKDF-like simulada)
     * a partir del device_secret.
     */
    private static generateHMAC(secret: string, betData: BetSignData, rawPayload: string): Task<Error, string> {
        return Task.fromPromise(async () => {
            const derivedKeyBase = `${secret}:${betData.structureId}:${betData.drawId}:${betData.userId}:${betData.timestamp}`;
            const derivedKey = (await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                derivedKeyBase
            )).toLowerCase();

            // HMAC-SHA256(derivedKey, rawPayload)
            // Nota: expo-crypto no expone una API directa para HMAC usando strings crudos como key
            // En un entorno de producción, se usaría react-native-quick-crypto o SubtleCrypto
            // Para propósitos de este MVP/Test, usamos un hash combinado que el backend puede replicar.

            const hmacInput = `${derivedKey}:${rawPayload}`;
            return (await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                hmacInput
            )).toLowerCase();
        });
    }
}
