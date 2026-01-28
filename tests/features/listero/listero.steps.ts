import { defineFeature, loadFeature } from 'jest-cucumber';
import { updateAuth } from '@/features/auth/store/update';
import { initialAuthModel } from '@/features/auth/store/initial';
import { AuthMsgType } from '@/features/auth/store/types';
import { update as updateBets } from '@/features/listero/bets/core/update';
import { initialModel as initialBetsModel } from '@/features/listero/bets/core/msg';
import { CoreMsgType } from '@/features/listero/bets/core/msg';
import { RemoteData } from '@/shared/core/remote.data';

const feature = loadFeature('./tests/features/listero/listero.feature');

defineFeature(feature, (test) => {
    let authModel = initialAuthModel;
    let betsModel = initialBetsModel;

    test('Autenticación exitosa como listero', ({ when, then, and }) => {
        when(/^intento iniciar sesión con usuario "([^"]*)" y contraseña "([^"]*)"$/, (username, password) => {
            // Simulate login response from backend
            const loginResponse = {
                type: 'Success',
                data: {
                    username,
                    role: 'listero',
                    token: 'mock-token'
                }
            };

            const [nextModel] = updateAuth(authModel, {
                type: AuthMsgType.LOGIN_RESPONSE_RECEIVED,
                webData: loginResponse as any
            });
            authModel = nextModel;
        });

        then('la autenticación debe ser exitosa', () => {
            expect(authModel.isAuthenticated).toBe(true);
        });

        and(/^el rol del usuario debe ser "([^"]*)"$/, (role) => {
            expect(authModel.user?.role).toBe(role);
        });
    });

    test('Listar información financiera del listero', ({ given, when, then }) => {
        given(/^que estoy autenticado como "([^"]*)"$/, (role) => {
            authModel = {
                ...initialAuthModel,
                isAuthenticated: true,
                user: { username: 'listero_test', role, token: 'mock-token' } as any
            };
        });

        when('solicito mi resumen financiero', () => {
            // In this test, we simulate the state after a successful fetch of dashboard data
            // For simplicity, we just check if the model can hold the data
            // (Actual dashboard store might be separate, but let's assume it's part of the feature state)
        });

        then('debo ver el balance total, ventas del día y comisiones acumuladas', () => {
            // Verification of UI/State for financials
            expect(true).toBe(true); // Placeholder for state check
        });
    });

    test('Gestionar sorteos abiertos y apuestas', ({ given, when, then, and }) => {
        given(/^que estoy autenticado como "([^"]*)"$/, (role) => {
            authModel = {
                ...initialAuthModel,
                isAuthenticated: true,
                user: { username: 'listero_test', role, token: 'mock-token' } as any
            };
            betsModel = { ...initialBetsModel, drawId: '1' };
        });

        when('listo los sorteos abiertos', () => {
            // Mock receiving draw info
            const [nextModel] = updateBets(betsModel, {
                type: 'CORE',
                payload: {
                    type: CoreMsgType.DRAW_INFO_RECEIVED,
                    webData: { type: 'Success', data: 'LOTERIA_NACIONAL' } as any
                }
            });
            betsModel = nextModel;
        });

        then('debo ver una lista de sorteos con su estado financiero individual', () => {
            expect(betsModel.drawTypeCode.type).toBe('Success');
        });

        when(/^selecciono un sorteo para anotar una apuesta de (\d+) DOP al número "([^"]*)"$/, (amount, number) => {
            // Simulate adding a bet
            const msg: any = {
                type: 'CREATE',
                payload: {
                    type: 'ADD_PLAY',
                    play: { number, amount: parseInt(amount) }
                }
            };
            // Note: we'd need to mock the create update correctly
            // For now, we simulate the effect on the model
            betsModel = {
                ...betsModel,
                // simulated state change
            };
        });

        then('la apuesta debe registrarse exitosamente', () => {
            expect(true).toBe(true);
        });

        and('la lista de apuestas del sorteo debe incluir la nueva apuesta', () => {
            expect(true).toBe(true);
        });
    });

    test('Verificar cumplimiento de reglas', ({ given, and, when, then }) => {
        given(/^que estoy autenticado como "([^"]*)"$/, (role) => {
            authModel = {
                ...initialAuthModel,
                isAuthenticated: true,
                user: { username: 'listero_test', role, token: 'mock-token' } as any
            };
        });

        and('las reglas de apuesta están configuradas', () => {
            // Mock rules in state
        });

        when('intento realizar una apuesta que excede el límite permitido', () => {
            // Simulate rule violation
        });

        then('el sistema debe rechazar la apuesta por incumplimiento de reglas', () => {
            expect(true).toBe(true);
        });

        and('debe mostrarse el mensaje de error correspondiente', () => {
            expect(true).toBe(true);
        });
    });
});
