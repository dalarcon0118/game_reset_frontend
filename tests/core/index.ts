/**
 * DSL de BDD con TEA - Exports públicos
 * 
 * Herramienta para escribir tests usando un DSL de BDD fluido sobre Jest + Detox
 * con soporte para múltiples frameworks de vista (React Native, React Web)
 */

export {
    scenario,
    ScenarioBuilder,
    it,
    StepFn
} from './scenario';

export {
    TestContext,
    TestContextConfig,
    createTestContext,
    withStore,
    withMock,
    buildContext,
    ContextBuilder,
    AssertionChain
} from './context';

export {
    createJestTest,
    describeFeature,
    describeScenario,
    BDDHooks,
    it as itBDD,
    itShould,
    ScenarioSteps
} from './jest-adapter';

export {
    DetoxScenarioBuilder,
    DetoxTestContext,
    detoxScenario,
    detoxTest,
    createDetoxContext,
    e2e
} from './detox-adapter';

export {
    ViewAdapter,
    ViewElement,
    ViewAdapterRegistry,
    getViewAdapterRegistry,
    setViewAdapter,
    createViewContext,
    createReactNativeViewAdapter,
    createReactWebViewAdapter,
} from './view-adapter';

export {
    createSuite,
    getSuite,
    suiteRegistry,
    SuiteBuilder,
    SuiteConfig,
    SuiteHooks,
    RegisteredScenario
} from './suite';
