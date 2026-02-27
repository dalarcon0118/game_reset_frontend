
import { Registry } from '../../../shared/core/utils/registry';

describe('Registry<T>', () => {
    let registry: Registry<string>;

    beforeEach(() => {
        registry = new Registry<string>('TEST_REGISTRY');
    });

    test('should register and retrieve items', () => {
        registry.register('item1', 'value1');
        expect(registry.get('item1')).toBe('value1');
    });

    test('should return undefined for non-existent items', () => {
        expect(registry.get('non-existent')).toBeUndefined();
    });

    test('should check if item exists', () => {
        registry.register('item1', 'value1');
        expect(registry.has('item1')).toBe(true);
        expect(registry.has('item2')).toBe(false);
    });

    test('should not overwrite existing items by default', () => {
        registry.register('item1', 'value1');
        registry.register('item1', 'value2');
        expect(registry.get('item1')).toBe('value1');
    });

    test('should overwrite existing items when override is true', () => {
        registry.register('item1', 'value1');
        registry.register('item1', 'value2', true);
        expect(registry.get('item1')).toBe('value2');
    });

    test('should get all items', () => {
        registry.register('item1', 'value1');
        registry.register('item2', 'value2');
        const all = registry.getAll();
        expect(all).toHaveLength(2);
        expect(all).toContain('value1');
        expect(all).toContain('value2');
    });

    test('should get all ids', () => {
        registry.register('item1', 'value1');
        registry.register('item2', 'value2');
        const ids = registry.getIds();
        expect(ids).toHaveLength(2);
        expect(ids).toContain('item1');
        expect(ids).toContain('item2');
    });

    test('should unregister items', () => {
        registry.register('item1', 'value1');
        const result = registry.unregister('item1');
        expect(result).toBe(true);
        expect(registry.has('item1')).toBe(false);
    });

    test('should return false when unregistering non-existent item', () => {
        const result = registry.unregister('non-existent');
        expect(result).toBe(false);
    });

    test('should clear all items', () => {
        registry.register('item1', 'value1');
        registry.register('item2', 'value2');
        registry.clear();
        expect(registry.getAll()).toHaveLength(0);
        expect(registry.getIds()).toHaveLength(0);
    });
});
