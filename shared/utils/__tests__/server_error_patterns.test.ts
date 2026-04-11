import { isServerSpecificErrorMessage, SERVER_ERROR_PATTERNS } from '../server_error_patterns';

describe('server_error_patterns', () => {

    describe('isServerSpecificErrorMessage', () => {

        describe('Debe retornar true para mensajes DEVICE_LOCKED', () => {
            test('Mensaje completo de DEVICE_LOCKED', () => {
                const message = 'DEVICE_LOCKED: Mismatch detected user_id=29 incoming=dcfd3820-f13e-4dbe-8b4f-0dcf3cc8607b stored=4bb0b53f-1b03-420b-bfac-7fff3293aaa6';
                expect(isServerSpecificErrorMessage(message)).toBe(true);
            });

            test('Mensaje simple con DEVICE_LOCKED', () => {
                const message = 'DEVICE_LOCKED';
                expect(isServerSpecificErrorMessage(message)).toBe(true);
            });

            test('Mensaje con DEVICE_LOCKED en cualquier posición', () => {
                const message = 'Error: DEVICE_LOCKED occurred';
                expect(isServerSpecificErrorMessage(message)).toBe(true);
            });
        });

        describe('Debe retornar true para mensajes con Mismatch detected', () => {
            test('Mensaje con Mismatch detected', () => {
                const message = 'Mismatch detected user_id=1 incoming=abc stored=xyz';
                expect(isServerSpecificErrorMessage(message)).toBe(true);
            });

            test('Mensaje simple con Mismatch detected', () => {
                const message = 'Mismatch detected';
                expect(isServerSpecificErrorMessage(message)).toBe(true);
            });
        });

        describe('Debe retornar true para mensajes con user_id', () => {
            test('Mensaje con user_id=', () => {
                const message = 'Error processing user_id=29';
                expect(isServerSpecificErrorMessage(message)).toBe(true);
            });

            test('Mensaje con user_id en medio del texto', () => {
                const message = 'Failed for user_id=42 at step 3';
                expect(isServerSpecificErrorMessage(message)).toBe(true);
            });
        });

        describe('Debe retornar true para mensajes con incoming', () => {
            test('Mensaje con incoming=', () => {
                const message = 'Value mismatch: incoming=abc123';
                expect(isServerSpecificErrorMessage(message)).toBe(true);
            });
        });

        describe('Debe retornar true para mensajes con stored', () => {
            test('Mensaje con stored=', () => {
                const message = 'Comparison failed: stored=xyz789';
                expect(isServerSpecificErrorMessage(message)).toBe(true);
            });
        });

        describe('Debe retornar false para mensajes genéricos', () => {
            test('Mensaje "Forbidden"', () => {
                expect(isServerSpecificErrorMessage('Forbidden')).toBe(false);
            });

            test('Mensaje "No tienes permisos"', () => {
                expect(isServerSpecificErrorMessage('No tienes permisos para realizar esta acción.')).toBe(false);
            });

            test('Mensaje de error genérico', () => {
                expect(isServerSpecificErrorMessage('Something went wrong')).toBe(false);
            });

            test('Mensaje vacío', () => {
                expect(isServerSpecificErrorMessage('')).toBe(false);
            });

            test('Mensaje null retorna false (safe handling)', () => {
                expect(isServerSpecificErrorMessage(null as any)).toBe(false);
            });

            test('Mensaje undefined retorna false (safe handling)', () => {
                expect(isServerSpecificErrorMessage(undefined as any)).toBe(false);
            });
        });

        describe('SERVER_ERROR_PATTERNS', () => {
            test('Debe tener DEVICE_LOCKED', () => {
                expect(SERVER_ERROR_PATTERNS.DEVICE_LOCKED).toBe('DEVICE_LOCKED');
            });

            test('Debe tener MISMATCH_DETECTED', () => {
                expect(SERVER_ERROR_PATTERNS.MISMATCH_DETECTED).toBe('Mismatch detected');
            });

            test('Debe tener USER_ID_PREFIX', () => {
                expect(SERVER_ERROR_PATTERNS.USER_ID_PREFIX).toBe('user_id=');
            });

            test('Debe tener INCOMING_PREFIX', () => {
                expect(SERVER_ERROR_PATTERNS.INCOMING_PREFIX).toBe('incoming=');
            });

            test('Debe tener STORED_PREFIX', () => {
                expect(SERVER_ERROR_PATTERNS.STORED_PREFIX).toBe('stored=');
            });
        });

        describe('Casos límite', () => {
            test('Mensaje muy largo con patrón al final', () => {
                const longMessage = 'This is a very long error message that contains many details but the important part is at the end: DEVICE_LOCKED';
                expect(isServerSpecificErrorMessage(longMessage)).toBe(true);
            });

            test('Mensaje con múltiples patrones', () => {
                const multiPattern = 'DEVICE_LOCKED: Mismatch detected user_id=29 incoming=dcfd stored=4bb0';
                expect(isServerSpecificErrorMessage(multiPattern)).toBe(true);
            });

            test('Mensaje sin patrón pero con texto similar', () => {
                expect(isServerSpecificErrorMessage('device_locked in progress')).toBe(false);
            });

            test('Mensaje con user_id pero sin el prefijo completo', () => {
                expect(isServerSpecificErrorMessage('user_id_value=29')).toBe(false);
            });
        });
    });
});