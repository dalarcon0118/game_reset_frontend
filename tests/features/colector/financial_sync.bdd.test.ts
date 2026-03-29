import { scenario, buildContext, setViewAdapter } from '../../core';
import { RemoteData } from '@core/tea-utils';
import { FinancialModule } from '../../../shared/store/financial/store';
import { financialRepository } from '../../../shared/repositories/financial';
import { createElmStore } from '../../../shared/core/engine';

// Mock repositories
jest.mock('../../../shared/repositories/financial', () => ({
    financialRepository: {
        getAggregation: jest.fn()
    }
}));

// Mock timer
jest.mock('../../../shared/repositories/system/time', () => ({
    TimerRepository: {
        getTrustedNow: jest.fn(() => Date.now())
    }
}));

// Mock Dashboard Store
const mockDashboardState = {
    model: {
        children: RemoteData.notAsked()
    }
};

// Objeto para capturar el listener de forma que Jest no se queje de scopes
const mockStore = {
    _listener: null as any
};

jest.mock('../../../features/colector/dashboard/core/store_context', () => {
    return {
        useDashboardStore: Object.assign(
            (selector?: any) => (selector ? selector(mockDashboardState) : mockDashboardState),
            {
                getState: () => mockDashboardState,
                subscribe: jest.fn((listener) => {
                    mockStore._listener = listener;
                    return () => { };
                })
            }
        )
    };
});

setViewAdapter('react-native');

interface FinancialSyncContext {
    dashboardChildren: any[];
    financialModel: any;
    dispatchedMsgs: any[];
    store: any;
    nodeId: any;
    nodeName: string;
    realSales: any;
    userProfile: any;
    financialData: any;
}

const syncContext = buildContext<FinancialSyncContext>()
    .withData('dashboardChildren', [])
    .withData('financialModel', null)
    .withData('dispatchedMsgs', [])
    .withData('store', null)
    .withData('nodeId', 0)
    .withData('nodeName', '')
    .withData('realSales', null)
    .withData('userProfile', null)
    .withData('financialData', null)
    .buildSync();

scenario('Sincronización automática de datos financieros post-login', syncContext)
    .given('Dashboard de colector con colecturías cargadas', ctx => {
        if (!ctx.data) throw new Error('Context data is undefined');
        // Inicializamos el store manualmente usando la definición del módulo
        ctx.data.store = createElmStore(FinancialModule.definition);
        ctx.data.financialModel = ctx.data.store.getState().model;

        // Simulamos que el dashboard tiene 2 hijos
        ctx.data.dashboardChildren = [
            { id: 101, name: 'Agencia A' },
            { id: 102, name: 'Agencia B' }
        ];

        // El repositorio devolverá datos para estos nodos
        (financialRepository.getAggregation as jest.Mock).mockImplementation((_, origin) => {
            if (origin === 'structure:101') {
                return Promise.resolve({ credits: 1000, debits: 200, total: 800, count: 5 });
            }
            if (origin === 'structure:102') {
                return Promise.resolve({ credits: 500, debits: 100, total: 400, count: 3 });
            }
            return Promise.resolve({ credits: 0, debits: 0, total: 0, count: 0 });
        });
    })
    .when('El Dashboard actualiza sus hijos', async ctx => {
        if (!ctx.data) throw new Error('Context data is undefined');
        // Simulamos que el dashboard pasa a Success
        mockDashboardState.model.children = RemoteData.success(ctx.data.dashboardChildren);

        // Disparamos el listener de la suscripción (esto lo hace Zustand normalmente)
        if (mockStore._listener) {
            mockStore._listener(mockDashboardState);
        }

        // Esperamos un momento para que los comandos asíncronos se ejecuten
        await new Promise(resolve => setTimeout(resolve, 100));

        ctx.data.financialModel = ctx.data.store.getState().model;
    })
    .then('Se deben solicitar los sumarios financieros para cada nodo', ctx => {
        if (!ctx.data) throw new Error('Context data is undefined');
        const summaries = ctx.data.financialModel.summaries;

        expect(summaries[101]).toBeDefined();
        expect(summaries[102]).toBeDefined();

        // Deberían estar en Success después de nuestra espera (o Loading si fuera muy lento)
        expect(summaries[101].type).toBe('Success');
        expect(summaries[102].type).toBe('Success');
    })
    .and('Los totales deben reflejar la suma del Ledger local', ctx => {
        if (!ctx.data) throw new Error('Context data is undefined');
        const summary101 = ctx.data.financialModel.summaries[101];
        const summary102 = ctx.data.financialModel.summaries[102];

        if (summary101.type === 'Success') {
            expect(summary101.data.totalCollected).toBe(1000);
            expect(summary101.data.netResult).toBe(800);
        }

        if (summary102.type === 'Success') {
            expect(summary102.data.totalCollected).toBe(500);
            expect(summary102.data.netResult).toBe(400);
        }
    })
    .test();

scenario('Stress Test Financiero: Manejo de Comisiones, Pérdidas y Balances Netos', syncContext)
    .given('Un escenario de pérdidas: Premios > Ventas con comisión del 12%', ctx => {
        if (!ctx.data) throw new Error('Context data is undefined');
        ctx.data.store = createElmStore(FinancialModule.definition);
        ctx.data.nodeId = 999;
        const commissionRate = 0.12; // 12%

        // Seteamos el perfil con la tasa específica
        ctx.data.store.dispatch({
            type: 'AUTH_USER_SYNCED',
            user: { structure: { id: '999', commission_rate: commissionRate } }
        });

        // Simulamos una "quiebra" en el nodo: Ventas 1000, Premios 1500
        ctx.data.financialData = {
            credits: 1000.00,
            debits: 1500.00,
            total: -500.00,
            count: 50
        };

        (financialRepository.getAggregation as jest.Mock).mockResolvedValue(ctx.data.financialData);
    })
    .when('El sistema calcula el balance financiero del nodo', async ctx => {
        if (!ctx.data) throw new Error('Context data is undefined');
        ctx.data.store.dispatch({ type: 'SYNC_NODES', nodeIds: [ctx.data.nodeId] });
        await new Promise(resolve => setTimeout(resolve, 50));
        ctx.data.financialModel = ctx.data.store.getState().model;
    })
    .then('Los cálculos deben ser 100% exactos y dinámicos', ctx => {
        if (!ctx.data) throw new Error('Context data is undefined');
        const summary = ctx.data.financialModel.summaries[ctx.data.nodeId];
        expect(summary.type).toBe('Success');

        if (summary.type === 'Success') {
            const data = summary.data;
            const expectedCommission = 1000 * 0.12; // 120.00 (Siempre sobre la venta bruta)
            const expectedNet = 1000 - 1500 - expectedCommission; // -620.00 (Pérdida total)

            // Verificamos que NO hay valores hardcoded (usamos los valores calculados)
            expect(data.totalCollected).toBe(1000.00);
            expect(data.totalPaid).toBe(1500.00);
            expect(data.estimatedCommission).toBe(expectedCommission);
            expect(data.netResult).toBe(expectedNet);

            // Control de Signo: El neto debe ser negativo (pérdida)
            expect(data.netResult).toBeLessThan(0);
        }
    })
    .and('No debe existir rastro de lógica de "10%" hardcoded en el resultado', ctx => {
        if (!ctx.data) throw new Error('Context data is undefined');
        const summary = ctx.data.financialModel.summaries[ctx.data.nodeId];
        if (summary.type !== 'Success') throw new Error('Summary is not in Success state');
        const data = summary.data;
        const tenPercentHardcoded = 1000 * 0.10; // 100
        expect(data.estimatedCommission).not.toBe(tenPercentHardcoded);
    })
    .test();

scenario('Integridad de datos en ColectorOperationCard (Anti-Hardcode)', syncContext)
    .given('Una colecturía "Agencia Premium" con ventas reales en el Ledger', ctx => {
        if (!ctx.data) throw new Error('Context data is undefined');
        ctx.data.store = createElmStore(FinancialModule.definition);
        ctx.data.nodeId = 500;
        ctx.data.nodeName = "Agencia Premium";

        // Datos dinámicos que NO deben ser 1000/200/800 para evitar falsos positivos por hardcode
        ctx.data.realSales = {
            credits: 2540.50,
            debits: 120.25,
            total: 2420.25,
            count: 15
        };

        (financialRepository.getAggregation as jest.Mock).mockResolvedValue(ctx.data.realSales);
    })
    .when('El Dashboard registra la colecturía y el FinancialModule sincroniza', async ctx => {
        if (!ctx.data) throw new Error('Context data is undefined');
        // 1. Sincronizamos el nodo en el FinancialModule
        ctx.data.store.dispatch({ type: 'SYNC_NODES', nodeIds: [ctx.data.nodeId] });

        // Esperamos a que el comando asíncrono termine
        await new Promise(resolve => setTimeout(resolve, 50));
        ctx.data.financialModel = ctx.data.store.getState().model;
    })
    .then('El sumario financiero para el nodo debe coincidir exactamente con el Ledger', ctx => {
        if (!ctx.data) throw new Error('Context data is undefined');
        const summary = ctx.data.financialModel.summaries[ctx.data.nodeId];

        expect(summary.type).toBe('Success');
        if (summary.type === 'Success') {
            // Verificamos que los datos en el Store sean los del Ledger, no valores fijos
            expect(summary.data.totalCollected).toBe(ctx.data.realSales.credits);
            expect(summary.data.totalPaid).toBe(ctx.data.realSales.debits);
            expect(summary.data.netResult).toBe(ctx.data.realSales.total);
        }
    })
    .and('Si los datos en el Ledger cambian, el sumario debe actualizarse (Reactividad)', async ctx => {
        if (!ctx.data) throw new Error('Context data is undefined');
        // Cambiamos los datos en el "backend" (Ledger)
        const updatedSales = {
            credits: 3000.00,
            debits: 500.00,
            total: 2500.00,
            count: 20
        };
        (financialRepository.getAggregation as jest.Mock).mockResolvedValue(updatedSales);

        // Forzamos un refresco (en la app real esto pasaría por un evento o polling)
        ctx.data.store.dispatch({ type: 'FETCH_SUMMARY_REQUESTED', nodeId: ctx.data.nodeId });

        await new Promise(resolve => setTimeout(resolve, 50));
        const updatedModel = ctx.data.store.getState().model;
        const updatedSummary = updatedModel.summaries[ctx.data.nodeId];

        expect(updatedSummary.type).toBe('Success');
        if (updatedSummary.type === 'Success') {
            expect(updatedSummary.data.totalCollected).toBe(3000.00);
            expect(updatedSummary.data.netResult).toBe(2500.00);
        }
    })
    .test();

scenario('Cálculo dinámico de comisiones basado en el perfil del colector', syncContext)
    .given('Un colector con una tasa de comisión del 15% en su perfil', ctx => {
        if (!ctx.data) throw new Error('Context data is undefined');
        ctx.data.store = createElmStore(FinancialModule.definition);
        ctx.data.userProfile = {
            id: 1,
            username: 'colector_pro',
            structure: { id: '100', commission_rate: 0.15 } // 15%
        };

        // Mock de datos financieros base en el repositorio
        (financialRepository.getAggregation as jest.Mock).mockResolvedValue({
            credits: 1000,
            debits: 0,
            total: 1000,
            count: 10
        });
    })
    .when('El sistema sincroniza el perfil del usuario', async ctx => {
        if (!ctx.data) throw new Error('Context data is undefined');
        // Este mensaje debe actualizar el commissionRate en el modelo del FinancialModule
        ctx.data.store.dispatch({ type: 'AUTH_USER_SYNCED', user: ctx.data.userProfile });

        // Simulamos la actualización de nodos para disparar el fetch
        ctx.data.store.dispatch({ type: 'SYNC_NODES', nodeIds: [100] });

        await new Promise(resolve => setTimeout(resolve, 50));
        ctx.data.financialModel = ctx.data.store.getState().model;
    })
    .then('Las comisiones deben calcularse usando el 15% y no valores hardcoded', ctx => {
        if (!ctx.data) throw new Error('Context data is undefined');
        const summary = ctx.data.financialModel.summaries['100'];

        // 1000 * 0.15 = 150
        const expectedCommission = 150;
        const expectedNet = 1000 - expectedCommission; // 850

        expect(summary.type).toBe('Success');
        if (summary.type === 'Success') {
            expect(summary.data.estimatedCommission).toBe(expectedCommission);
            expect(summary.data.netResult).toBe(expectedNet);
        }
    })
    .test();
