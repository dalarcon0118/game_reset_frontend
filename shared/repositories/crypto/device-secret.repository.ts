/**
 * Servicio Criptográfico: Device Secret
 * 
 * Gestiona el ciclo de vida del secreto de 32 bytes único del dispositivo,
 * necesario para firmar el Fingerprint de las apuestas.
 * 
 * Principios: Declarativo, Puro (Task), y Seguro (SecureStore).
 */

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Task, Result, Either, ok, err } from '../../core';
import { apiClient } from '../../services/api_client';
import { settings } from '../../../config/settings';
import { logger } from '../../utils/logger';
import { CRYPTO_KEYS, CRYPTO_LOG_TAGS, CRYPTO_MESSAGES } from './constants';

const log = logger.withTag(CRYPTO_LOG_TAGS.DEVICE_SECRET);
const SECRET_KEY = CRYPTO_KEYS.DEVICE_SECRET;

export class DeviceSecretRepository {

    /**
     * FASE 1 Zero Trust: Guarda el secreto diario recibido del servidor.
     */
    static saveDailySecret(secret: string): Task<Error, string> {
        return this.saveToStorage(secret)
            .tap(() => log.info('Daily secret from server saved to SecureStore'));
    }

    /**
     * Obtiene el secreto existente.
     * Zero Trust: El secreto debe existir (inyectado por login).
     */
    static getSecret(): Task<Error, string> {
        return this.readFromStorage();
    }

    /**
     * @deprecated FASE 1 Zero Trust: El servidor es el único origen.
     */
    static getOrCreateSecret(): Task<Error, string> {
        return this.getSecret();
    }

    /**
     * Sincroniza el secreto con el backend.
     * Retorna Task<Error, void> que representa la operación HTTP lazy.
     */
    static registerWithBackend(secret: string): Task<Error, void> {
        return Task.fromPromise(async (signal) => {
            // 1. Generar hash del secret para verificación en backend
            const hash = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                secret
            );

            // 2. Simular el cifrado Fernet que debería ocurrir (o enviarlo crudo sobre HTTPS)
            // NOTA: En un entorno real ideal, el frontend cifra el secret con una llave pública RSA
            // del servidor. Para este MVP (y según la propuesta), asumimos que la conexión es TLS
            // y el backend se encarga de cifrarlo antes de guardarlo en BD.

            // Ajuste basado en la propuesta Fase 2 (backend): El backend espera
            // 'device_secret_hash' y 'encrypted_device_secret'. Si el frontend no tiene la llave
            // para cifrar (Fernet), podemos enviarlo en plano bajo TLS y que el backend lo cifre.
            // Para mantener el contrato del API, enviaremos el 'secret' en el campo 'encrypted'
            // simulando que ya va protegido por la capa de transporte.

            await apiClient.post(settings.api.endpoints.deviceRegister(), {
                device_secret_hash: hash,
                encrypted_device_secret: secret // En TLS, el transporte lo cifra.
            });

            log.info(CRYPTO_MESSAGES.DEVICE_SECRET_REGISTERED);
        }).mapError(e => {
            log.error(CRYPTO_MESSAGES.DEVICE_SECRET_REGISTRATION_ERROR, e);
            return e instanceof Error ? e : new Error(String(e));
        });
    }

    // --- Private Pure Tasks --- //

    private static readFromStorage(): Task<Error, string> {
        return Task.fromPromise(async () => {
            const stored = await SecureStore.getItemAsync(SECRET_KEY);
            if (!stored) throw new Error(CRYPTO_MESSAGES.DEVICE_SECRET_NOT_FOUND);
            return stored;
        });
    }

    private static saveToStorage(secret: string): Task<Error, string> {
        return Task.fromPromise(async () => {
            await SecureStore.setItemAsync(SECRET_KEY, secret);
            return secret;
        });
    }

    private static generateNewSecret(): Task<Error, string> {
        return Task.fromSync(() => {
            // Generar 32 bytes de entropía segura y codificar a base64
            const randomBytes = Crypto.getRandomBytes(32);
            // Convertir Uint8Array a base64 (o hex)
            return Array.from(randomBytes)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        });
    }
}
