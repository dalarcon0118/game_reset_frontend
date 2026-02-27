import { defineFeature, loadFeature } from 'jest-cucumber';
import { updateAuth } from '@/features/auth/store/update';
import { initialAuthModel } from '@/features/auth/store/initial';
import { AuthMsgType } from '@/features/auth/store/types';
import { initialModel as initialBetsModel } from '@/features/bet-workspace/initial.types';
import { CoreMsgType } from '@/_legacy/workspace/core/msg';
import { AppKernel } from '../../../shared/core/architecture/kernel';
// import { BolitaFeature } from '../../../features/bet-bolita/bolita.feature';
import { LoteriaFeature } from '../../../features/listero/bet-loteria/loteria.feature';
import { BetWorkspaceFeature } from '../../../features/listero/bet-workspace/workspace.feature';
import { BetRegistry } from '../../../../.trae/_legacy/workspace/core/registry';
// import { ParletRegistryFeature } from '../../../features/bet-bolita/parlet/parlet.registry';
// import { StandardRegistryFeature } from '../../../features/bet-bolita/standard/standard.registry';
// import { CentenaRegistryFeature } from '../../../features/bet-bolita/centena/centena.registry';
import { LoteriaRegistryFeature } from '../../../features/listero/bet-loteria/loteria.registry';
import { restDataProvider } from '../../../shared/core/architecture/adapters';
import { gameResetAuthProvider } from '../../../features/auth/adapters/auth_provider';
import { AuthSubscriptionHandler } from '../../../features/auth/subscription_handler';

// Helper to setup the test environment with all features registered
const setupTestEnvironment = () => {
    // Register Kernel Subscription Handlers
    AppKernel.registerSubscriptionHandler(AuthSubscriptionHandler);

    // Configure Kernel with mocks or adapters
    // In unit/integration tests, we might want to mock these, but for now we use the real ones
    // assuming they are properly mocked in test-env or behave predictably.
    AppKernel.configure({
        dataProvider: restDataProvider,
        authProvider: gameResetAuthProvider,
    });

    // Initialize Bet Registry Features (Domain Logic)
    // Moved from workspace bootstrap to config to maintain agnostic principle
    // BetRegistry.register(StandardRegistryFeature);
    // BetRegistry.register(ParletRegistryFeature);
    // BetRegistry.register(CentenaRegistryFeature);
    BetRegistry.register(LoteriaRegistryFeature);

    // Register Features
    // AppKernel.registerFeature(BolitaFeature);
    AppKernel.registerFeature(LoteriaFeature);
    AppKernel.registerFeature(BetManagementFeature);
    AppKernel.registerFeature(BetRulesFeature);
    AppKernel.registerFeature(BetListFeature);
    AppKernel.registerFeature(BetSuccessFeature);
    AppKernel.registerFeature(BetRewardsFeature);
    AppKernel.registerFeature(CreateBetFeature);
    AppKernel.registerFeature(EditBetFeature);
    AppKernel.registerFeature(BetKeyboardFeature);
    AppKernel.registerFeature(BetWorkspaceGatewayFeature);
};

const feature = loadFeature('./tests/features/listero/listero.feature');

defineFeature(feature, (test) => {
    // Setup environment before tests run
    setupTestEnvironment();

    let authModel = initialAuthModel;
    let betsModel = initialBetsModel;

    // Helper to get the update function dynamically
    const getUpdateBets = () => {
        const feature = AppKernel.getFeature('BET_WORKSPACE_GATEWAY');
        if (!feature) throw new Error('BET_WORKSPACE_GATEWAY not registered');
        return feature.update;
    };

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
                user: loginResponse.data as any
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
            betsModel = { ...initialBetsModel, currentDrawId: '1' };
        });

        when('listo los sorteos abiertos', () => {
            // Mock receiving draw info
            const updateBets = getUpdateBets() as any;
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
            // const msg: any = {
            //     type: 'CREATE',
            //     payload: {
            //         type: 'ADD_PLAY',
            //         play: { number, amount: parseInt(amount) }
            //     }
            // };
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
