
import { AppKernel } from '../shared/core/architecture/kernel';
import { Feature, FeatureAdapter, Plugin } from '../shared/core/architecture/interfaces';

describe('AppKernel Architecture', () => {
    
    // Scenario 1: Registering a Simple Feature (No Adapter)
    test('Registering a Simple Feature', () => {
        const simpleFeature: Feature = {
            id: 'AUTH',
            init: () => [{}, null],
            update: (msg: any, state: any) => [{ ...state, handled: true }, null]
        };

        AppKernel.registerFeature(simpleFeature);
        expect(AppKernel.getFeature('AUTH')).toBe(simpleFeature);

        // Test Update Resolution
        const msg = { type: 'AUTH.LOGIN' };
        const resolution = AppKernel.resolveUpdate(msg);
        
        expect(resolution).not.toBeNull();
        expect(resolution?.featureId).toBe('AUTH');
        
        // Execute update
        if (resolution) {
            const [newState] = resolution.update({});
            expect(newState.handled).toBe(true);
        }
    });

    // Scenario 2: Registering a Feature with an Adapter
    test('Registering a Feature with an Adapter', () => {
        const adapter: FeatureAdapter<any, any> = {
            lift: (msg) => ({ type: 'BETTING_WRAPPER', payload: msg }),
            lower: (msg) => {
                if (msg.type === 'BETTING_WRAPPER') return msg.payload;
                return null;
            }
        };

        const adaptedFeature: Feature = {
            id: 'BETTING',
            init: () => [{}, null],
            update: (msg: any, state: any) => [{ ...state, value: msg.value }, null],
            adapter: adapter
        };

        AppKernel.registerFeature(adaptedFeature);
        
        const globalMsg = { type: 'BETTING_WRAPPER', payload: { value: 100 } };
        const resolution = AppKernel.resolveUpdate(globalMsg);
        
        expect(resolution).not.toBeNull();
        expect(resolution?.featureId).toBe('BETTING');
        
        if (resolution) {
            const [newState] = resolution.update({});
            expect(newState.value).toBe(100);
        }
    });

    // Scenario 3: Registering a Global Plugin
    test('Registering a Global Plugin', () => {
        let pluginInitCalled = false;
        const plugin: Plugin = {
            id: 'LOGGER',
            onInit: () => { pluginInitCalled = true; }
        };

        AppKernel.registerPlugin(plugin);
        expect(pluginInitCalled).toBe(true);
        expect(AppKernel.getPlugins()).toContain(plugin);
    });

    // Scenario 4: Registering a Subscription Handler
    test('Registering a Subscription Handler', () => {
        const handler = {
            id: 'TEST_HANDLER',
            createSubscription: (params: any) => ({ type: 'CUSTOM' as any, payload: params })
        };

        AppKernel.registerSubscriptionHandler(handler);
        expect(AppKernel.getSubscriptionHandler('TEST_HANDLER')).toBe(handler);
    });
});
