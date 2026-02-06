import { WebData } from '../remote.data';

/**
 * Base entity interface that all entities must implement.
 * Requires at least an `id` field for identification.
 * 
 * @example
 * interface User extends Entity {
 *     id: string;
 *     name: string;
 *     email: string;
 * }
 */
export interface Entity {
    id: string;
}

/**
 * Configuration for TEAStore CRUD operations.
 * Provides service functions for all CRUD operations.
 * 
 * @example
 * const userService = {
 *     fetchAll: async () => { ... },
 *     fetchOne: async (id) => { ... },
 *     create: async (data) => { ... },
 *     update: async (id, data) => { ... },
 *     delete: async (id) => { ... },
 * };
 */
export interface TEAStoreConfig<T extends Entity> {
    /**
     * Fetch all entities.
     * @returns Promise resolving to array of entities
     */
    fetchAll: () => Promise<T[]>;

    /**
     * Fetch a single entity by its ID.
     * @param id - The entity ID to fetch
     * @returns Promise resolving to the entity
     */
    fetchOne: (id: string) => Promise<T>;

    /**
     * Create a new entity.
     * @param data - The entity data without the id field
     * @returns Promise resolving to the created entity with its assigned ID
     */
    create: (data: Omit<T, 'id'>) => Promise<T>;

    /**
     * Update an existing entity.
     * @param id - The ID of the entity to update
     * @param data - Partial data to update on the entity
     * @returns Promise resolving to the updated entity
     */
    update: (id: string, data: Partial<T>) => Promise<T>;

    /**
     * Delete an entity by its ID.
     * @param id - The ID of the entity to delete
     * @returns Promise resolving when deletion is complete
     */
    delete: (id: string) => Promise<void>;

    /**
     * Optional: Initial data to populate the store with.
     * If provided, the store will start with this data instead of NotAsked.
     */
    initialData?: T[];

    /**
     * Optional: Custom error handler called when operations fail.
     * @param error - The error that occurred
     */
    onError?: (error: any) => void;
}

/**
 * Store state for TEAStore.
 * Manages all CRUD operations and UI state.
 */
export interface TEAStoreState<T extends Entity> {
    /**
     * Collection of all entities with RemoteData state.
     * Used for list views.
     */
    items: WebData<T[]>;

    /**
     * Currently selected entity with RemoteData state.
     * Used for detail views or editing.
     */
    selectedItem: WebData<T>;

    /**
     * Status of the last CRUD operation.
     * Used to show success/error messages after operations.
     */
    operationStatus: WebData<T>;

    /**
     * Whether the store is in create mode.
     * Used to show a form for creating a new entity.
     */
    isCreating: boolean;

    /**
     * Whether the store is in edit mode.
     * Used to show a form for editing an existing entity.
     */
    isEditing: boolean;

    /**
     * The ID of the entity currently being edited.
     * Null when not in edit mode.
     */
    editingId: string | null;
}

/**
 * Message types for TEAStore.
 * Defines all possible messages that can be dispatched to the store.
 */
export enum TEAStoreMsgType {
    // Read operations
    FETCH_ALL_REQUESTED = 'FETCH_ALL_REQUESTED',
    FETCH_ALL_RESPONSE = 'FETCH_ALL_RESPONSE',
    FETCH_ONE_REQUESTED = 'FETCH_ONE_REQUESTED',
    FETCH_ONE_RESPONSE = 'FETCH_ONE_RESPONSE',

    // CRUD operations
    CREATE_REQUESTED = 'CREATE_REQUESTED',
    CREATE_RESPONSE = 'CREATE_RESPONSE',
    UPDATE_REQUESTED = 'UPDATE_REQUESTED',
    UPDATE_RESPONSE = 'UPDATE_RESPONSE',
    DELETE_REQUESTED = 'DELETE_REQUESTED',
    DELETE_RESPONSE = 'DELETE_RESPONSE',

    // UI state operations
    SELECT_ITEM = 'SELECT_ITEM',
    START_CREATE = 'START_CREATE',
    START_EDIT = 'START_EDIT',
    CANCEL_EDIT = 'CANCEL_EDIT',

    // Utility operations
    CLEAR_ERROR = 'CLEAR_ERROR',
    RESET = 'RESET',
}

/**
 * Message union type for TEAStore.
 * All possible messages that can be dispatched to the store.
 */
export type TEAStoreMsg<T extends Entity> =
    // Read operations
    | { type: TEAStoreMsgType.FETCH_ALL_REQUESTED }
    | { type: TEAStoreMsgType.FETCH_ALL_RESPONSE; response: WebData<T[]> }
    | { type: TEAStoreMsgType.FETCH_ONE_REQUESTED; id: string }
    | { type: TEAStoreMsgType.FETCH_ONE_RESPONSE; response: WebData<T> }

    // CRUD operations
    | { type: TEAStoreMsgType.CREATE_REQUESTED; data: Omit<T, 'id'> }
    | { type: TEAStoreMsgType.CREATE_RESPONSE; response: WebData<T> }
    | { type: TEAStoreMsgType.UPDATE_REQUESTED; id: string; data: Partial<T> }
    | { type: TEAStoreMsgType.UPDATE_RESPONSE; response: WebData<T> }
    | { type: TEAStoreMsgType.DELETE_REQUESTED; id: string }
    | { type: TEAStoreMsgType.DELETE_RESPONSE; response: WebData<void> }

    // UI state operations
    | { type: TEAStoreMsgType.SELECT_ITEM; id: string | null }
    | { type: TEAStoreMsgType.START_CREATE }
    | { type: TEAStoreMsgType.START_EDIT; id: string }
    | { type: TEAStoreMsgType.CANCEL_EDIT }

    // Utility operations
    | { type: TEAStoreMsgType.CLEAR_ERROR }
    | { type: TEAStoreMsgType.RESET };
