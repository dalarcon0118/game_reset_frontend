
/**
 * Navigation Strategy Interface
 * Decouples navigation decisions from the router implementation
 */
export interface NavigationStrategy {
    getHomeRoute: (user: any) => string;
    canAccess: (user: any, path: string) => boolean;
    getBackPath: (user: any, currentPath: string) => string | null;
}

/**
 * Standardized Data Provider Interface
 * Inspired by Refine.dev but adapted for TEA/FP
 */
export interface DataProvider {
    getList: <T>(resource: string, params?: ListParams) => Promise<ListResponse<T>>;
    getOne: <T>(resource: string, id: string | number) => Promise<T>;
    create: <T>(resource: string, variables: any) => Promise<T>;
    update: <T>(resource: string, id: string | number, variables: any) => Promise<T>;
    delete: <T>(resource: string, id: string | number) => Promise<T>;
    custom?: <T>(params: CustomParams) => Promise<T>;
}

export interface ListParams {
    pagination?: { current: number; pageSize: number };
    sorters?: { field: string; order: 'asc' | 'desc' }[];
    filters?: { field: string; operator: string; value: any }[];
}

export interface ListResponse<T> {
    data: T[];
    total: number;
}

export interface LoginParams {
    username: string;
    pin: string;
    remember?: boolean;
}

export interface CustomParams {
    url: string;
    method: 'get' | 'post' | 'put' | 'patch' | 'delete';
    payload?: any;
    headers?: Record<string, string>;
}

/**
 * Standardized Auth Response
 * Predictable result type for TEA consumption
 */
export type AuthResult<T = any> =
    | { success: true; redirectTo?: string; data?: T }
    | { success: false; error: { name?: string; message: string; redirectTo?: string } };

/**
 * Standardized Auth Provider Interface
 * Abstract complexity from services and return predictable results
 */
export interface AuthProvider {
    login: (params: LoginParams) => Promise<AuthResult>;
    logout: () => Promise<AuthResult>;
    checkError: (error: any) => Promise<void>;
    checkAuth: () => Promise<void>;
    getPermissions: () => Promise<any>;
    getUserIdentity: () => Promise<any>;
    // Optional methods from standard pattern
    register?: (params: any) => Promise<AuthResult>;
    forgotPassword?: (params: any) => Promise<AuthResult>;
    updatePassword?: (params: any) => Promise<AuthResult>;
}

/**
 * Standardized Notification Provider
 */
export interface NotificationProvider {
    open: (params: NotificationParams) => void;
    close: (key: string) => void;
}

export interface NotificationParams {
    key?: string;
    message: string;
    description?: string;
    type: 'success' | 'error' | 'progress';
    duration?: number;
}

/**
 * Resource Definition
 */
export interface ResourceDefinition {
    name: string;
    list?: string;
    create?: string;
    edit?: string;
    show?: string;
    meta?: Record<string, any>;
}

export interface KernelAdapters {
    dataProvider: DataProvider;
    authProvider: AuthProvider;
    navigationStrategy: NavigationStrategy;
    apiClient?: any;
    resources?: ResourceDefinition[];
}



// ==========================================
// Feature Architecture Interfaces
// ==========================================

/**
 * Feature Adapter
 * Translates messages between the Global scope and the Feature scope.
 * Essential for the "Hybrid Kernel" approach.
 */
export interface FeatureAdapter<FeatureMsg, GlobalMsg> {
    /**
     * Wrap a feature-specific message into a global message
     */
    lift: (msg: FeatureMsg) => GlobalMsg;

    /**
     * Unwrap a global message into a feature-specific message
     * Returns null if the message does not belong to this feature
     */
    lower: (msg: GlobalMsg) => FeatureMsg | null;
}

/**
 * External Features Gateway Interface
 * Standardized interface for handling external messages in composite features.
 * Allows decoupling a feature from its sub-features or external dependencies.
 */
export interface ExternalFeaturesHandler<Msg = any, Model = any> {
    handle(msg: Msg, model: Model): [Model, any] | null;
}

/**
 * Feature Gateway Interface
 * Kernel-level interface for cross-feature integration following TEA architecture.
 * 
 * Responsibilities:
 * - Message routing between features (no translation)
 * - Subscription configuration (no execution)
 * - State delegation (no mutation)
 * 
 * Anti-Corruption Layer: Decouples core functionality from external dependencies
 */
export interface FeatureGateway<InMsg = any, State = any> {
    /**
     * Handle incoming messages from other features
     * Returns null if message is not relevant to this gateway
     * No message translation - use adapters for that
     */
    receive(msg: InMsg, state: State): [State, any] | null;

    /**
     * Optional: Configure subscriptions for external events
     * Returns SubDescriptor for TEA engine execution
     * Gateway only configures, doesn't execute effects
     */
    subscriptions?(state: State): any | any[];
}

/**
 * Feature API Interface
 * Restricted API exposed to features during registration
 */
export interface FeatureAPI {
    // TODO: Add route and menu registrars when available
    // routes: RouteRegistrar;
    // menu: MenuRegistrar;
    services: {
        register: (id: string, service: any) => void;
        get: (id: string) => any;
    };
}

/**
 * Feature Implementation Interface (The Bundle)
 * Represents the actual loaded feature module
 */
export interface FeatureImplementation {
    /**
     * Entry point for feature integration.
     * Receives a restricted API to register routes, menus, and services.
     */
    register: (api: FeatureAPI) => void;

    /**
     * Optional: Root Provider for the feature (Context/Store)
     * If provided, the Kernel will mount this provider in the tree.
     */
    Provider?: React.ComponentType<{ children: React.ReactNode }>;
}

/**
 * Lazy Feature Definition (The Manifest)
 * Lightweight definition for initial app load
 */
export interface LazyFeature {
    id: string;

    /**
     * Function to load the feature module.
     * Can return a Promise (Web/Async) or the implementation directly (RN/Sync).
     * Supports both modern FeatureImplementation and Legacy Feature types.
     */
    load: () => Promise<FeatureImplementation | Feature> | FeatureImplementation | Feature;

    /**
     * Optional: Triggers for loading the feature
     */
    trigger?: {
        path?: string; // React Navigation path or URL path
        event?: string; // Global event name
    };
}

/**
 * Legacy Feature Interface (Deprecated but supported for backward compatibility)
 * Represents a modular unit of functionality (Model-View-Update).
 */
export interface Feature<State = any, Msg = any, Cmd = any> {
    /**
     * Unique identifier for the feature (e.g., 'AUTH', 'BETTING')
     */
    id: string;

    /**
     * Initializes the feature state and initial commands
     */
    init: () => [State, Cmd];

    /**
     * The core update logic for the feature
     * Returns a tuple of [NewState, Command] (or a Return object compatible with iteration)
     */
    update: (msg: Msg, state: State) => [State, Cmd];

    /**
     * Optional: Subscriptions to external events (Time, WebSocket, etc.)
     */
    subscriptions?: (state: State) => any;

    /**
     * Optional: Adapter for integrating into the global message loop.
     * If provided, the Kernel will use this to route messages.
     * If not provided, the Kernel assumes a direct message mapping based on ID.
     */
    adapter?: FeatureAdapter<Msg, any>;

    /**
     * Optional: Lifecycle method for configuration and dependency injection.
     * Called by the Kernel immediately after registration.
     */
    configure?: (config: any) => void;
}

/**
 * Plugin Interface
 * Represents a cross-cutting concern (Middleware) that hooks into the Kernel.
 */
export interface Plugin {
    id: string;

    /**
     * Called when the Kernel initializes
     */
    onInit?: () => void;

    /**
     * Called before a message is processed by a feature
     */
    onMsg?: (msg: any, state: any) => void;

    /**
     * Called after a state update
     */
    onUpdate?: (prevState: any, nextState: any, msg: any) => void;
}
