import { logger } from '../../utils/logger';

/**
 * Generic Registry Class
 * 
 * Provides a standard mechanism for registering and retrieving items by ID.
 * Useful for Plugins, Features, Strategies, and other runtime components.
 * 
 * @template T The type of item being registered
 */
export class Registry<T> {
    protected items = new Map<string, T>();
    protected name: string;

    constructor(name: string) {
        this.name = name;
    }

    /**
     * Registers an item with a unique ID.
     * 
     * @param id Unique identifier for the item
     * @param item The item to register
     * @param override Whether to overwrite if the ID already exists (default: false)
     */
    register(id: string, item: T, override = false): void {
        if (this.items.has(id) && !override) {
            logger.warn(`${this.name}: Item '${id}' already registered. Use override=true to replace.`, 'REGISTRY');
            return;
        }

        this.items.set(id, item);
        logger.debug(`${this.name}: Registered '${id}'`, 'REGISTRY');
    }

    /**
     * Retrieves an item by its ID.
     * 
     * @param id The identifier of the item
     * @returns The item or undefined if not found
     */
    get(id: string): T | undefined {
        return this.items.get(id);
    }

    /**
     * Unregisters an item by its ID.
     * 
     * @param id The identifier of the item to remove
     * @returns True if the item was removed, false if it didn't exist
     */
    unregister(id: string): boolean {
        const deleted = this.items.delete(id);
        if (deleted) {
            logger.debug(`${this.name}: Unregistered '${id}'`, 'REGISTRY');
        } else {
            logger.warn(`${this.name}: Attempted to unregister non-existent item '${id}'`, 'REGISTRY');
        }
        return deleted;
    }

    /**
     * Checks if an item with the given ID exists.
     */
    has(id: string): boolean {
        return this.items.has(id);
    }

    /**
     * Returns all registered items as an array.
     */
    getAll(): T[] {
        return Array.from(this.items.values());
    }

    /**
     * Returns all registered IDs.
     */
    getIds(): string[] {
        return Array.from(this.items.keys());
    }

    /**
     * Clears all registered items.
     */
    clear(): void {
        this.items.clear();
        logger.debug(`${this.name}: Cleared all items`, 'REGISTRY');
    }
}
