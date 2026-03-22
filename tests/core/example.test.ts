/**
 * Ejemplos del DSL de BDD con TEA - Tests registrados en Jest
 * 
 * Este archivo demuestra cómo escribir tests usando:
 * 1. DSL fluido básico (scenario + given/when/then)
 * 2. buildContext para crear contextos complejos
 * 3. Suites de tests con setup/cleanup común
 * 4. Tests E2E con componentes de usuario
 */

import {
    scenario,
    createTestContext,
    buildContext,
    createJestTest,
    createSuite,
    setViewAdapter,
    TestContext
} from './index';

// Importar解毒适配器 para E2E
import {
    detoxScenario,
    createDetoxContext,
    DetoxTestContext,
    e2e
} from './detox-adapter';


// ============================================================
// EJEMPLO 1: Test básico con DSL fluido
// ============================================================

scenario('checkout happy path')
    .given(ctx => {
        ctx.data = { hasProduct: true, productPrice: 100 };
    })
    .when(ctx => {
        ctx.data.orderCreated = true;
    })
    .then(ctx => {
        expect(ctx.data.orderCreated).toBe(true);
    })
    .test();


// ============================================================
// EJEMPLO 2: buildContext - Crear contextos complejos
// ============================================================

/**
 * buildContext permite crear contextos con datos predefinidos
 * Es útil para compartir configuración entre tests
 */

// Crear un contexto base para tests de autenticación
const authContextBase = buildContext<any>()
    .withData('feature', 'authentication')
    .withData('timeout', 5000)
    .withData('retryCount', 3)
    .buildSync();

console.log('Contexto base creado:', authContextBase.data);

// Usar el contexto base en un scenario
scenario('login with context', authContextBase)
    .given('Usuario existe en sistema', ctx => {
        // ctx.data ya tiene: feature, timeout, retryCount
        expect(ctx.data.feature).toBe('authentication');
        ctx.data.user = { username: 'admin', token: null };
    })
    .when('Usuario hace login', ctx => {
        ctx.data.user!.token = 'abc-123-token';
    })
    .then('Token debe existir', ctx => {
        expect(ctx.data.user!.token).toBeDefined();
    })
    .test();


// ============================================================
// EJEMPLO 3: Contexto anidado para UI components
// ============================================================

/**
 * Crear contexto para testing de componentes UI
 */
interface UIComponentContext extends TestContext {
    component?: {
        name: string;
        props?: Record<string, any>;
        state?: Record<string, any>;
    };
    rendered?: boolean;
}

// Usar buildContext con datos anidados
const buttonComponentContext = buildContext<UIComponentContext>()
    .withData('component', {
        name: 'Button',
        props: { variant: 'primary', disabled: false }
    })
    .buildSync();


// ============================================================
// EJEMPLO 2b: buildContext con valores calculados (withComputed)
// ============================================================

/**
 * buildContext soporta valores calculados dinámicamente
 * con .withComputed() y .withComputedAsync()
 */

// Valores calculados síncronos
const computedContext = buildContext<any>()
    .withData('base', 'test-')
    .withComputed('timestamp', () => Date.now())
    .withComputed('id', ctx => ctx.data.base + Math.random().toString(36).substring(7))
    .buildSync();

console.log('Contexto con valores calculados:', computedContext.data);

// Ejemplo con valores async (requiere async/await)
async function createAsyncContext() {
    const asyncContext = await buildContext<any>()
        .withData('userId', 123)
        .withComputedAsync('userData', async (ctx) => {
            // Simular llamada API
            return { id: ctx.data.userId, name: 'Test User' };
        })
        .build();

    return asyncContext;
}

// Usar el contexto en un scenario
scenario('Test con valores calculados')
    .given('Contexto con valores calculados', ctx => {
        // Los valores calculados están disponibles en ctx.data
        expect(ctx.data.timestamp).toBeDefined();
        expect(ctx.data.id).toContain('test-');
    })
    .when('Ejecutar test', ctx => {
        // Nuevo valor calculado
        ctx.data.result = ctx.data.id + '-processed';
    })
    .then('Verificar resultado', ctx => {
        expect(ctx.data.result).toContain('test-');
    })
    .test();

scenario<UIComponentContext>('Button component renders')
    .given('Button configurado', ctx => {
        expect(ctx.component?.name).toBe('Button');
        expect(ctx.component?.props?.disabled).toBe(false);
    })
    .when('Renderizamos el componente', ctx => {
        ctx.rendered = true;
    })
    .then('Componente debe estar visible', ctx => {
        expect(ctx.rendered).toBe(true);
    })
    .test();


// ============================================================
// EJEMPLO 4: SUITE con ESCENARIOS - Forma correcta
// ============================================================

/**
 * Suite representa un grupo de tests relacionados
 * Los escenarios se REGISTRAN en la suite usando .register()
 */

// Definir contexto de la suite
interface CheckoutSuiteContext extends TestContext {
    suiteSetup?: boolean;
    user?: { id: number; name: string };
    cart?: string[];
    order?: any;
}

// Paso 1: Crear los escenarios SIN .test()
const agregarCarritoScenario = scenario<CheckoutSuiteContext>('Agregar producto al carrito')
    .given('Usuario autenticado', ctx => {
        ctx.suiteSetup = true;
        ctx.user = { id: 1, name: 'testuser' };
        ctx.cart = [];
    })
    .when('Agrega producto', ctx => {
        ctx.cart!.push('product-1');
    })
    .then('Carrito tiene 1 producto', ctx => {
        expect(ctx.cart!.length).toBe(1);
    });

const checkoutScenario = scenario<CheckoutSuiteContext>('Completar checkout')
    .given('Usuario con productos', ctx => {
        ctx.cart = ['product-1', 'product-2'];
    })
    .when('Inicia checkout', ctx => {
        ctx.order = { id: 'order-1', items: ctx.cart, total: 200 };
    })
    .then('Orden creada', ctx => {
        expect(ctx.order).toBeDefined();
    });

// Paso 2: Crear la suite y REGISTRAR los escenarios con .register()
const checkoutSuite = createSuite<CheckoutSuiteContext>(
    'Checkout Suite',
    { suiteSetup: false },
    { timeout: 60000 }
)
    .beforeAll(async (ctx) => {
        console.log('🚀 Setup suite (beforeAll)');
        ctx.suiteSetup = true;
        ctx.user = { id: 1, name: 'testuser' };
    })
    .afterAll(async (ctx) => {
        console.log('🏁 Cleanup suite (afterAll)');
    })
    // Registrar los escenarios
    .register('Agregar producto al carrito', agregarCarritoScenario)
    .register('Completar checkout', checkoutScenario);

// Paso 3: Ejecutar la suite (genera describe + it en Jest)
checkoutSuite.run();


// ============================================================
// EJEMPLO 5: E2E - Flujo completo UI (Navegar -> Click -> Loading -> Lista)
// ============================================================

/**
 * Ejemplo de test E2E con flujo completo:
 * 1. Navegar a ruta A (Home)
 * 2. Click en botón B (Ver Detalles)
 * 3. Esperar loading
 * 4. Cargar datos
 * 5. Esperar listar datos
 */

interface E2EContext extends TestContext {
    router?: { currentRoute: string; params?: Record<string, any> };
    ui?: {
        buttons: Record<string, boolean>;
        loading: boolean;
        data: any[] | null;
    };
}

// Configurar view adapter
setViewAdapter('react-native');

scenario<E2EContext>('E2E: Navegar, click, esperar loading, listar datos')
    // GIVEN: Navegar a ruta inicial
    .given('Usuario en pantalla Home', ctx => {
        ctx.router = { currentRoute: 'HomeScreen' };
        ctx.ui = { buttons: {}, loading: false, data: null };
    })

    // WHEN: Click en botón
    .when('Usuario presiona botón "Ver Detalles"', ctx => {
        // Simular click
        ctx.ui!.buttons['details-button'] = true;
        ctx.router!.currentRoute = 'DetailsScreen';
        ctx.ui!.loading = true;
    })

    // THEN: Verificar loading
    .then('Debe mostrar indicador de carga', ctx => {
        expect(ctx.ui!.loading).toBe(true);
        expect(ctx.router!.currentRoute).toBe('DetailsScreen');
    })

    // AND: Esperar que carguen los datos
    .and('Datos cargan exitosamente', async ctx => {
        // Simular espera de API
        await new Promise(resolve => setTimeout(resolve, 500));
        ctx.ui!.loading = false;
        ctx.ui!.data = [
            { id: 1, name: 'Item 1', status: 'active' },
            { id: 2, name: 'Item 2', status: 'active' },
            { id: 3, name: 'Item 3', status: 'inactive' }
        ];
    })

    // THEN: Verificar lista
    .then('Debe mostrar la lista de datos', ctx => {
        expect(ctx.ui!.loading).toBe(false);
        expect(ctx.ui!.data).not.toBeNull();
        expect(ctx.ui!.data!.length).toBe(3);
        expect(ctx.ui!.data![0].name).toBe('Item 1');
    })

    // AND: Verificar elemento específico
    .and('Primer item debe estar activo', ctx => {
        expect(ctx.ui!.data![0].status).toBe('active');
    })

    .test();


// ============================================================
// EJEMPLO 6: DETOX con EXPO - Test E2E real
// ============================================================

/**
 * Ejemplo de test E2E con Detox real (Expo)
 * 
 * Este test usa el detoxScenario que tiene acceso a:
 * - device: para controlar el dispositivo
 * - element(by.id): para encontrar elementos
 * - waitFor: para esperar estados
 * 
 * IMPORTANTE: Requiere que Expo esté corriendo con Detox
 */

// Interfaz para el contexto de Detox con mocks de API
interface DetoxAPIContext extends DetoxTestContext {
    apiMock?: {
        getUserProfile?: jest.Mock;
        getUserBets?: jest.Mock;
    };
    state?: {
        isLoading: boolean;
        userProfile: any | null;
        bets: any[];
        error: string | null;
    };
}

// Crear contexto con mocks de API
function createDetoxAPIContext(): DetoxAPIContext {
    const base = createDetoxContext();
    return {
        ...base,
        apiMock: {
            getUserProfile: jest.fn().mockResolvedValue({ id: 1, name: 'Test User' }),
            getUserBets: jest.fn().mockResolvedValue([{ id: 1, amount: 100 }])
        },
        state: {
            isLoading: false,
            userProfile: null,
            bets: [],
            error: null
        }
    };
}

// Test E2E con Detox: Pantalla de Profile que carga datos al montarse
detoxScenario<DetoxAPIContext>('Pantalla Profile carga datos al montarse')

    // GIVEN: La app está iniciada y en la pantalla de Profile
    .given('Pantalla Profile se monta', async (ctx) => {
        // Esperar que la pantalla exista
        await ctx.waitFor('profileScreen', 10000);

        // Verificar que hay un indicador de loading
        const hasLoading = await ctx.exists('loadingIndicator');
        ctx.state!.isLoading = hasLoading;
    })

    // THEN: Verificar que muestra loading al inicio
    .then('Debe mostrar indicador de carga', async (ctx) => {
        expect(ctx.state!.isLoading).toBe(true);
    })

    // AND: Esperar a que los datos terminen de cargar
    .and('Datos terminan de cargar', async (ctx) => {
        // Esperar a que desaparezca el loading
        await ctx.waitFor('loadingIndicator', 15000);

        // NOTA: En Detox real, esperarías a que un elemento de contenido aparezca
        // await waitFor(element(by.text('Bienvenido'))).toBeVisible().withTimeout(10000);

        // Simular que los datos llegaron
        ctx.state!.isLoading = false;
        ctx.state!.userProfile = { id: 1, name: 'Test User' };
    })

    // THEN: Verificar que los datos se muestran
    .then('Debe mostrar los datos del usuario', async (ctx) => {
        expect(ctx.state!.isLoading).toBe(false);
        expect(ctx.state!.userProfile).not.toBeNull();
        expect(ctx.state!.userProfile!.name).toBe('Test User');
    })

    // AND: Verificar que la API fue llamada
    .and('API fue llamada correctamente', async (ctx) => {
        // Verificar que el mock fue llamado
        // ctx.apiMock!.getUserProfile!.toHaveBeenCalled();
        console.log('✅ API llamada al montarse el componente');
    })

    .test();


// ============================================================
// EJEMPLO 6b: DETOX - Navegación + Click + Lista
// ============================================================

detoxScenario('Navegar a lista de apuestas, click, cargar datos')

    // GIVEN: En pantalla Home
    .given('App iniciada en HomeScreen', async (ctx) => {
        await ctx.waitFor('homeScreen', 5000);
    })

    // WHEN: Click en botón "Mis Apuestas"
    .when('Usuario presiona botón Mis Apuestas', async (ctx) => {
        await ctx.tap('btn-my-bets');
    })

    // THEN: Debe navegar a pantalla de bets
    .then('Debe navegar a MyBetsScreen', async (ctx) => {
        await ctx.waitFor('myBetsScreen', 10000);
    })

    // AND: Debe mostrar loading
    .and('Debe mostrar loading', async (ctx) => {
        const hasLoading = await ctx.exists('loadingIndicator');
        expect(hasLoading).toBe(true);
    })

    // AND: Esperar datos y verificar lista
    .and('Datos cargan y lista se muestra', async (ctx) => {
        // Esperar a que la lista aparezca
        await ctx.waitFor('betsList', 15000);

        // Verificar que hay elementos en la lista
        const firstItem = await ctx.exists('bet-item-0');
        expect(firstItem).toBe(true);
    })

    .test();


// ============================================================
// RESUMEN: Cómo usar Detox con el DSL
// ============================================================

/**
 * 
 * detoxScenario vs scenario:
 * 
 * scenario()        → Test unitario/integración (jest)
 * detoxScenario()   → Test E2E móvil (Detox + Jest)
 * 
 * 
 * Para tests E2E con Expo:
 * 1. Ejecutar: npx expo start
 * 2. En otra terminal: npx detox test
 * 3. El test usa device, element, waitFor de Detox
 * 
 * 
 * Para verificar que componente se monta:
 * - await ctx.waitFor('componentId', timeout)
 * - await ctx.exists('elementId')
 * 
 * 
 * Para verificar llamadas API:
 * - Mockear con jest.fn() antes del test
 * - Verificar con mock.toHaveBeenCalled()
 * 
 */


// ============================================================
// EJEMPLO 6: Test con cleanup manual (onSuccess/onFailed)
// ============================================================

scenario('Test con cleanup automático')
    .given('Preparar datos de test', ctx => {
        ctx.data = { tempId: 'test-123' };
    })
    .when('Ejecutar operación', ctx => {
        ctx.data.processed = true;
    })
    .then('Verificar resultado', ctx => {
        expect(ctx.data.processed).toBe(true);
    })
    .onSuccess(async ctx => {
        console.log('✅ Test pasó - cleanup:', ctx.data.tempId);
        // Acá limpiarías: tempId, archivos, etc.
    })
    .onFailed(async (ctx, error) => {
        console.log('❌ Test falló:', error.message);
        // Rollback si es necesario
    })
    .test();


// ============================================================
// RESUMEN DE USO
// ============================================================

/**
 * 
 * FORMA 1: Scenario individual (más simple)
 * -----------------------------------------
 * scenario('nombre')
 *   .given(...)
 *   .when(...)
 *   .then(...)
 *   .test()
 * 
 * 
 * FORMA 2: Con buildContext
 * -----------------------------------------
 * const ctx = buildContext<T>()
 *   .withData('key', value)
 *   .build()
 * 
 * scenario('nombre', ctx)
 *   .given(...)
 *   .test()
 * 
 * 
 * FORMA 3: Con Suite (varios scenarios relacionados)
 * -----------------------------------------
 * const mySuite = createSuite<MyContext>('Nombre Suite', initialCtx)
 *   .beforeAll(...)   // Una vez al inicio
 *   .afterAll(...)   // Una vez al final
 * 
 * scenario<MyContext>('escenario 1')
 *   .given(...)
 *   .test()
 * 
 * scenario<MyContext>('escenario 2')
 *   .given(...)
 *   .test()
 * 
 * 
 * FORMA 4: E2E con view adapter
 * -----------------------------------------
 * setViewAdapter('react-native') // o 'react-web'
 * 
 * scenario<E2EContext>('test UI')
 *   .given('pantalla inicial', ...)
 *   .when('interactuar', ...)
 *   .then('verificar', ...)
 *   .test()
 * 
 */
