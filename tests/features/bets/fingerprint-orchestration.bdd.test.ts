/**
 * BDD Suite: Fingerprint Criptográfico - Mitigación de Riesgos Arquitectónicos
 * 
 * Esta suite sirve como PUNTO DE ACCESO (Access Point) para el desarrollo
 * guiado por comportamiento (BDD) de los 5 riesgos identificados en el diseño:
 * 
 * 1. Pérdida del Device Secret (Cold Start)
 * 2. Pérdida de Monotonic Clock (Reboots)
 * 3. Condiciones de Carrera Offline (Mutex)
 * 4. Divergencia de Serialización (Raw Payload)
 * 5. Rotura de Cadena de Hashes (Sincronización FIFO)
 */

import { scenario, createSuite, buildContext, TestContext } from '../../core';
import { CoreService, setAuthRepository } from '@/core/core_module/service';
import { AuthRepository } from '@/shared/repositories/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/shared/services/api_client';
import { logger } from '@/shared/utils/logger';
import { settings } from '@/config/settings';
import { DeviceSecretRepository } from '@/shared/repositories/crypto/device-secret.repository';
import { TimeAnchorRepository } from '@/shared/repositories/crypto/time-anchor.repository';
import { HashChainRepository } from '@/shared/repositories/crypto/hash-chain.repository';
import { FingerprintRepository } from '@/shared/repositories/crypto/fingerprint.repository';

// ============================================================
// MOCKS DE INFRAESTRUCTURA
// ============================================================
jest.mock('@react-native-community/netinfo', () => ({
    fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true, type: 'wifi', details: {} }),
    addEventListener: jest.fn(),
    useNetInfo: jest.fn(),
}));

const secureStoreState: Record<string, string> = {};
jest.mock('expo-secure-store', () => ({
    __esModule: true,
    getItemAsync: jest.fn(async (key: string) => secureStoreState[key] || null),
    setItemAsync: jest.fn(async (key: string, value: string) => { secureStoreState[key] = value; }),
    deleteItemAsync: jest.fn(async (key: string) => { delete secureStoreState[key]; }),
}));

// ============================================================
// CONTEXTO DE LA SUITE
// ============================================================
interface FingerprintRiskContext extends TestContext {
    systemState: {
        sessionActive: boolean;
        isOnline: boolean;
        currentMonotonic: number;
        currentSystemTime: number;
    };
    device: { secret: string | null; isRegistered: boolean };
    timeAnchor: { serverTime: number; signature: string; monotonicAtSync: number } | null;
    hashChain: { lastHash: string; history: any[] };
    syncQueue: any[];
    errors: string[];
    betPayload?: any;
    fingerprint?: any;
    orderedSyncQueue?: any[];
}

const initializeTestInfrastructure = async (): Promise<boolean> => {
    apiClient.config({ settings, log: logger.withTag('TEST_API_CLIENT') });
    setAuthRepository(AuthRepository);
    const session = await CoreService.verifySessionContext();
    return session !== null;
};

const createBaseContext = () => buildContext<FingerprintRiskContext>()
    .withData('systemState', { sessionActive: false, isOnline: true, currentMonotonic: 1000, currentSystemTime: Date.now() })
    .withData('device', { secret: null, isRegistered: false })
    .withData('timeAnchor', null)
    .withData('hashChain', { lastHash: '0'.repeat(64), history: [] })
    .withData('syncQueue', [])
    .withData('errors', [])
    .withData('betPayload', null)
    .withData('fingerprint', null)
    .withData('orderedSyncQueue', [])
    .buildSync();


// ============================================================
// ESCENARIOS DE RIESGO ARQUITECTÓNICO
// ============================================================

// ------------------------------------------------------------
// Riesgo 1: Pérdida del Device Secret / Instalación Limpia
// ------------------------------------------------------------
const coldStartScenario = scenario<FingerprintRiskContext>('Riesgo 1: Pérdida del Device Secret (Cold Start)')
    .given('Un dispositivo con instalación limpia (sin secret en SecureStore) que inicia sesión', async ctx => {
        await AsyncStorage.clear();
        for (const key in secureStoreState) delete secureStoreState[key];

        ctx.systemState.sessionActive = await initializeTestInfrastructure();
        await AuthRepository.login('jose', '123456');
        ctx.systemState.sessionActive = await initializeTestInfrastructure();
    })
    .when('El CoreModule dispara el boot del DeviceSecretService', async ctx => {
        // Simula la lógica del futuro DeviceSecretService
        const stored = secureStoreState['DEVICE_SECRET'];
        if (!stored) {
            const newSecret = 'simulated-32-byte-secret'; // Simulamos generación criptográfica
            secureStoreState['DEVICE_SECRET'] = newSecret;
            ctx.device.secret = newSecret;

            if (ctx.systemState.isOnline) {
                // Simulación de apiClient.post('/api/auth/device-register/')
                ctx.device.isRegistered = true;
            }
        }
    })
    .then('Debe generar un secret nuevo, persistirlo y registrarlo en el backend', async ctx => {
        expect(secureStoreState['DEVICE_SECRET']).toBeTruthy();
        expect(ctx.device.isRegistered).toBe(true);
    });

// ------------------------------------------------------------
// Riesgo 2: Reinicios del Dispositivo (Pérdida de Monotonic)
// ------------------------------------------------------------
const rebootMitigationScenario = scenario<FingerprintRiskContext>('Riesgo 2: Detección de reinicio del dispositivo (Drift)')
    .given('Un dispositivo con un ancla temporal válida guardada hace 1 hora', ctx => {
        ctx.timeAnchor = {
            serverTime: 1600000000,
            signature: 'valid-sig',
            monotonicAtSync: 50000 // El teléfono llevaba 50s encendido al sincronizar
        };
        // Simulamos un reinicio: El sistema avanza 1 hora, pero el monotonic vuelve a casi 0
        ctx.systemState.currentSystemTime += 3600000;
        ctx.systemState.currentMonotonic = 1000; // Recién encendido (1s)
    })
    .when('El usuario intenta generar una apuesta offline', ctx => {
        // Lógica de detección de reinicio (drift checking)
        const monotonicDelta = ctx.systemState.currentMonotonic - ctx.timeAnchor!.monotonicAtSync;
        if (monotonicDelta < 0) {
            ctx.errors.push('REBOOT_DETECTED');
        }
    })
    .then('Debe invalidar el ancla temporal y bloquear la apuesta (requiere red)', ctx => {
        expect(ctx.errors).toContain('REBOOT_DETECTED');
    });

// ------------------------------------------------------------
// Riesgo 3: Condiciones de carrera offline (Mutex)
// ------------------------------------------------------------
const mutexScenario = scenario<FingerprintRiskContext>('Riesgo 3: Condiciones de carrera offline (Mutex)')
    .given('El usuario presiona "Vender" 3 veces simultáneamente offline', ctx => {
        ctx.hashChain.lastHash = 'hash-base';
    })
    .when('El servicio de Fingerprint recibe las peticiones concurrentes', async ctx => {
        // Simulación de Mutex real para HashChainService.appendToChain()
        let lock: Promise<void> = Promise.resolve();

        const processWithMutex = async (id: number) => {
            // Adquirir lock
            const currentLock = lock;
            let release: () => void = () => { };
            lock = currentLock.then(() => new Promise<void>(res => { release = res; }));

            await currentLock;

            try {
                const prevHash = ctx.hashChain.lastHash;
                await new Promise(r => setTimeout(r, 10)); // Simula I/O y CPU
                const newHash = `hash-${id}-prev-${prevHash}`;
                ctx.hashChain.lastHash = newHash;
                ctx.hashChain.history.push({ id, hash: newHash, prevHash });
            } finally {
                release();
            }
        };

        // Disparamos concurrentemente (Promise.all)
        await Promise.all([
            processWithMutex(1),
            processWithMutex(2),
            processWithMutex(3)
        ]);
    })
    .then('Las firmas deben encadenarse de forma estrictamente secuencial sin bifurcar la cadena', ctx => {
        const history = ctx.hashChain.history;
        expect(history.length).toBe(3);
        // Verificamos que el hash de uno sea el prevHash del siguiente
        // El orden de ejecución puede variar, pero la cadena debe ser íntegra
        expect(history[1].prevHash).toBe(history[0].hash);
        expect(history[2].prevHash).toBe(history[1].hash);
    });

// ------------------------------------------------------------
// Riesgo 4: Divergencia de Serialización (Raw Payload)
// ------------------------------------------------------------
const serializationScenario = scenario<FingerprintRiskContext>('Riesgo 4: Divergencia de serialización (Raw Payload)')
    .given('Una apuesta con floats y orden específico de llaves', ctx => {
        ctx.betPayload = { amount: 500.00, drawId: 1, numbers: ['12'] };
    })
    .when('Se genera el fingerprint final', ctx => {
        // Simulación de canonicalizePayload del frontend
        const rawPayload = JSON.stringify({
            amt: ctx.betPayload.amount.toFixed(2), // "500.00" stringificado exacto
            did: ctx.betPayload.drawId,
            nums: ctx.betPayload.numbers
        });

        ctx.fingerprint = {
            hash: 'simulated-hmac',
            raw_payload: rawPayload // <-- Clave para mitigar el riesgo
        };
    })
    .then('El payload debe incluir un string raw exacto para validación byte-por-byte en el backend', ctx => {
        expect(ctx.fingerprint.raw_payload).toBeDefined();
        expect(typeof ctx.fingerprint.raw_payload).toBe('string');
        expect(ctx.fingerprint.raw_payload).toContain('"amt":"500.00"');
    });

// ------------------------------------------------------------
// Riesgo 5: Rotura de Cadena de Hashes (Sincronización FIFO)
// ------------------------------------------------------------
const fifoSyncScenario = scenario<FingerprintRiskContext>('Riesgo 5: Rotura de cadena por sincronización desordenada')
    .given('3 apuestas offline encoladas en SQLite (A, B, C)', ctx => {
        ctx.syncQueue = [
            { id: 'C', timestamp: 3000, hash: 'hash-C' },
            { id: 'A', timestamp: 1000, hash: 'hash-A' },
            { id: 'B', timestamp: 2000, hash: 'hash-B' }
        ];
    })
    .when('Vuelve la conexión y el syncFlow las lee para enviar al backend', ctx => {
        // Simulación del SyncFlow (debe ordenar por timestamp/prevHash antes de enviar)
        ctx.orderedSyncQueue = [...ctx.syncQueue].sort((a, b) => a.timestamp - b.timestamp);
    })
    .then('El frontend DEBE enviarlas en orden FIFO estricto para no generar HASH_CHAIN_OUT_OF_ORDER', ctx => {
        const order = ctx.orderedSyncQueue!.map((b: any) => b.id);
        expect(order).toEqual(['A', 'B', 'C']); // Orden estricto garantizado
    });


// ============================================================
// SUITE RUNNER
// ============================================================

export const FingerprintRiskMitigationSuite = createSuite<FingerprintRiskContext>(
    'Fingerprint Criptográfico - Mitigación de Riesgos (Access Points)',
    createBaseContext().data as FingerprintRiskContext,
    { timeout: 30000 }
)
    .beforeAll(async () => {
        await AsyncStorage.clear();
        for (const key in secureStoreState) delete secureStoreState[key];
        (AuthRepository as any).currentUser = null;
        (AuthRepository as any).isHydrated = false;
    })
    .register('Riesgo 1: Pérdida del Device Secret (Cold Start)', coldStartScenario)
    .register('Riesgo 2: Detección de reinicio del dispositivo (Drift)', rebootMitigationScenario)
    .register('Riesgo 3: Condiciones de carrera offline (Mutex)', mutexScenario)
    .register('Riesgo 4: Divergencia de serialización (Raw Payload)', serializationScenario)
    .register('Riesgo 5: Rotura de cadena por sincronización desordenada', fifoSyncScenario);

// Ejecutar
FingerprintRiskMitigationSuite.run();