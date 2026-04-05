// services/service_locator.ts
import { Registry } from '@core/utils/registry';
import { createLazy } from '@core/utils/lazy';

interface Service<T> {
    instance: T;
    factory: () => Promise<T>;  // Para carga lazy
}

// Registry + Lazy = DI Container
class ServiceLocator {
    private services = new Registry<Service<any>>('SERVICE_LOCATOR');
    private instances = new Map<string, any>();
    private singletons = new Map<string, any>();

    /**
     * Registra un servicio con su factory (carga perezosa async)
     */
    register<T>(id: string, factory: () => Promise<T>): void {
        this.services.register(id, {
            instance: undefined,
            factory
        });
    }

    private pendingSingletons = new Map<string, () => any>();

    private isClass(fn: any): boolean {
        if (typeof fn !== 'function') return false;
        
        // 1. Native ES6 classes
        const str = Function.prototype.toString.call(fn);
        if (/^class\s/.test(str)) return true;
        
        // 2. Transpiled classes often include classCallCheck
        if (str.includes('_classCallCheck') || str.includes('classCallCheck')) return true;
        
        // 3. Arrow functions don't have a prototype
        if (!fn.prototype) return false;
        
        // 4. Heuristic: Constructors/Classes usually start with a capital letter
        if (fn.name && /^[A-Z]/.test(fn.name)) return true;
        
        return false;
    }

    /**
     * Registra un singleton con factory lazy (inicializacion bajo demanda)
     */
    registerSingleton<T>(id: string, factoryOrInstance: T | (() => T)): void {
        if (typeof factoryOrInstance === 'function' && !this.isClass(factoryOrInstance)) {
            this.pendingSingletons.set(id, factoryOrInstance as () => T);
        } else {
            this.singletons.set(id, factoryOrInstance);
            this.instances.set(id, factoryOrInstance);
        }
    }

    /**
     * Obtiene el servicio (lo carga si no existe) - SIEMPRE ASYNC
     */
    async get<T>(id: string): Promise<T> {
        if (this.instances.has(id)) {
            return this.instances.get(id) as T;
        }

        const singleton = this.singletons.get(id);
        if (singleton) {
            return singleton as T;
        }

        const service = this.services.get(id);
        if (!service) {
            throw new Error(`Service '${id}' not registered`);
        }

        const instance = await service.factory();
        this.instances.set(id, instance);
        return instance as T;
    }

    /**
     * Obtiene un singleton - SINCRONO
     * Inicializa automaticamente si existe factory pendiente
     * Lanza error si no existe
     */
    getSync<T>(id: string): T {
        // 1. Buscar instancia ya creada
        const singleton = this.singletons.get(id);
        if (singleton) {
            return singleton as T;
        }

        const instance = this.instances.get(id);
        if (instance) {
            return instance as T;
        }

        // 2. ✅ MAGIC: Si existe factory pendiente, inicializar AHORA MISMO bajo demanda
        const factory = this.pendingSingletons.get(id);
        if (factory) {
            const newInstance = factory();
            this.singletons.set(id, newInstance);
            this.instances.set(id, newInstance);
            this.pendingSingletons.delete(id);
            return newInstance as T;
        }

        throw new Error(`Singleton '${id}' not found or not yet initialized`);
    }

    /**
     * Verifica si existe (sin cargar)
     */
    has(id: string): boolean {
        return this.instances.has(id) 
            || this.singletons.has(id) 
            || this.pendingSingletons.has(id)
            || this.services.has(id);
    }
}

export const locator = new ServiceLocator();