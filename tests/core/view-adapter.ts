/**
 * Adaptador de Vista - Capa de abstracción agnóstica al framework
 * 
 * Permite que el DSL funcione con cualquier framework de UI (React Native, React Web, etc.)
 * sin depender de una implementación específica.
 */

import { TestContext } from './context';

/**
 * Interfaz agnóstica para operaciones de vista
 * Implementa esta interfaz para crear un adaptador para tu framework
 */
export interface ViewAdapter {
    /** Nombre del adaptador */
    readonly name: string;

    // === Selección de elementos ===

    /** Encuentra un elemento por su ID */
    findById(id: string): ViewElement;

    /** Encuentra elementos por texto */
    findByText(text: string): ViewElement;

    /** Encuentra elementos por selector (CSS o testID) */
    findBySelector(selector: string): ViewElement;

    // === Utilidades ===

    /** Espera a que la vista esté lista */
    waitForReady(timeout?: number): Promise<void>;

    /** Toma una captura de pantalla */
    screenshot(name?: string): Promise<void>;

    /** Limpia el estado de la vista */
    cleanup(): Promise<void>;
}

/**
 * Elemento de vista - representación abstracta de un elemento UI
 */
export interface ViewElement {
    // === Acciones ===

    /** Toca el elemento */
    tap(): Promise<void>;

    /** Larga presión */
    longPress(duration?: number): Promise<void>;

    /** Escribe texto */
    typeText(text: string): Promise<void>;

    /** Limpia el texto */
    clearText(): Promise<void>;

    /** Scroll hacia el elemento */
    scrollTo(direction: 'up' | 'down' | 'left' | 'right'): Promise<void>;

    // === Assertions ===

    /** Verifica si el elemento existe */
    exists(): Promise<boolean>;

    /** Verifica si el elemento es visible */
    isVisible(): Promise<boolean>;

    /** Obtiene el texto del elemento */
    getText(): Promise<string>;

    /** Obtiene atributos del elemento */
    getAttributes(): Promise<Record<string, string>>;
}

/**
 * Registro global de adaptadores de vista
 */
class ViewAdapterRegistry {
    private static instance: ViewAdapterRegistry;
    private currentAdapter: ViewAdapter | null = null;
    private adapters: Map<string, ViewAdapter> = new Map();

    private constructor() { }

    static getInstance(): ViewAdapterRegistry {
        if (!ViewAdapterRegistry.instance) {
            ViewAdapterRegistry.instance = new ViewAdapterRegistry();
        }
        return ViewAdapterRegistry.instance;
    }

    /**
     * Registra un adaptador de vista
     */
    register(adapter: ViewAdapter): void {
        this.adapters.set(adapter.name, adapter);
    }

    /**
     * Establece el adaptador activo
     */
    setActive(adapterName: string): void {
        const adapter = this.adapters.get(adapterName);
        if (!adapter) {
            throw new Error(`View adapter '${adapterName}' not found. Available: ${Array.from(this.adapters.keys()).join(', ')}`);
        }
        this.currentAdapter = adapter;
    }

    /**
     * Obtiene el adaptador activo
     */
    get(): ViewAdapter {
        if (!this.currentAdapter) {
            throw new Error('No view adapter set. Call setActive() first or use useViewAdapter().');
        }
        return this.currentAdapter;
    }

    /**
     * Verifica si hay un adaptador activo
     */
    hasActive(): boolean {
        return this.currentAdapter !== null;
    }
}

/**
 * Obtiene el registro de adaptadores
 */
// Exportar la clase para uso avanzado
export { ViewAdapterRegistry };

export function getViewAdapterRegistry(): ViewAdapterRegistry {
    return ViewAdapterRegistry.getInstance();
}

/**
 * Configura el adaptador de vista a usar
 */
export function setViewAdapter(adapterName: string): void {
    getViewAdapterRegistry().setActive(adapterName);
}

/**
 * Hook para usar el adaptador de vista en un test
 */
export function createViewContext(): ViewAdapter {
    return getViewAdapterRegistry().get();
}

// === Adaptador para React Native (Detox) ===

/**
 * Crea un adaptador de vista para React Native (usando Detox)
 */
export function createReactNativeViewAdapter(): ViewAdapter {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    let detox: any;
    try {
        detox = require('detox');
    } catch (e) {
        // Detox no está disponible, retornar un adaptador dummy para evitar errores de importación
        const dummyElement: ViewElement = {
            tap: async () => { },
            longPress: async (duration?: number) => { },
            typeText: async (text: string) => { },
            clearText: async () => { },
            scrollTo: async (direction: 'up' | 'down' | 'left' | 'right') => { },
            exists: async () => false,
            isVisible: async () => false,
            getText: async () => '',
            getAttributes: async () => ({}),
        };
        return {
            name: 'react-native', // Mantener el nombre original aunque sea dummy
            findById: (id: string) => {
                console.log(`[Dummy Detox] findById: ${id}`);
                return dummyElement;
            },
            findByText: (text: string) => {
                console.log(`[Dummy Detox] findByText: ${text}`);
                return dummyElement;
            },
            findBySelector: (selector: string) => {
                console.log(`[Dummy Detox] findBySelector: ${selector}`);
                return dummyElement;
            },
            waitForReady: async (timeout?: number) => {
                console.log(`[Dummy Detox] waitForReady: ${timeout}ms`);
            },
            screenshot: async (name?: string) => {
                console.log(`[Dummy Detox] screenshot: ${name}`);
            },
            cleanup: async () => {
                console.log(`[Dummy Detox] cleanup`);
            },
        };
    }

    const { element, by, waitFor, device } = detox;

    return {
        name: 'react-native',

        findById(id: string): ViewElement {
            const el = element(by.id(id));
            return createDetoxElement(el);
        },

        findByText(text: string): ViewElement {
            const el = element(by.text(text));
            return createDetoxElement(el);
        },

        findBySelector(selector: string): ViewElement {
            // En Detox, asumimos que es un testID
            const el = element(by.id(selector));
            return createDetoxElement(el);
        },

        async waitForReady(timeout = 10000): Promise<void> {
            // Esperar a que el dispositivo esté listo
            await device.waitForDeviceToBeReady();
        },

        async screenshot(name?: string): Promise<void> {
            await device.takeScreenshot(name || `screenshot-${Date.now()}`);
        },

        async cleanup(): Promise<void> {
            // Detox maneja la limpieza automáticamente
        },
    };
}

function createDetoxElement(el: any): ViewElement {
    return {
        async tap(): Promise<void> {
            await el.tap();
        },

        async longPress(duration = 1000): Promise<void> {
            await el.longPress(duration);
        },

        async typeText(text: string): Promise<void> {
            await el.typeText(text);
        },

        async clearText(): Promise<void> {
            await el.clearText();
        },

        async scrollTo(direction: 'up' | 'down' | 'left' | 'right'): Promise<void> {
            await el.scroll(direction);
        },

        async exists(): Promise<boolean> {
            return await el.exists();
        },

        async isVisible(): Promise<boolean> {
            try {
                await el.toBeVisible();
                return true;
            } catch {
                return false;
            }
        },

        async getText(): Promise<string> {
            return await el.getText();
        },

        async getAttributes(): Promise<Record<string, string>> {
            return await el.getAttributes();
        },
    };
}

// === Adaptador para React Web (Playwright/Cypress) ===

/**
 * Crea un adaptador de vista para React Web (usando Playwright)
 */
export function createReactWebViewAdapter(): ViewAdapter {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    let playwright: any;
    try {
        playwright = require('playwright');
    } catch (e) {
        // Playwright no está disponible, retornar un adaptador dummy
        const dummyElement: ViewElement = {
            tap: async () => { },
            longPress: async (duration?: number) => { },
            typeText: async (text: string) => { },
            clearText: async () => { },
            scrollTo: async (direction: 'up' | 'down' | 'left' | 'right') => { },
            exists: async () => false,
            isVisible: async () => false,
            getText: async () => '',
            getAttributes: async () => ({}),
        };
        return {
            name: 'react-web', // Mantener el nombre original aunque sea dummy
            findById: (id: string) => {
                console.log(`[Dummy Playwright] findById: ${id}`);
                return dummyElement;
            },
            findByText: (text: string) => {
                console.log(`[Dummy Playwright] findByText: ${text}`);
                return dummyElement;
            },
            findBySelector: (selector: string) => {
                console.log(`[Dummy Playwright] findBySelector: ${selector}`);
                return dummyElement;
            },
            waitForReady: async (timeout?: number) => {
                console.log(`[Dummy Playwright] waitForReady: ${timeout}ms`);
            },
            screenshot: async (name?: string) => {
                console.log(`[Dummy Playwright] screenshot: ${name}`);
            },
            cleanup: async () => {
                console.log(`[Dummy Playwright] cleanup`);
            },
        };
    }

    const { chromium } = playwright;

    let browser: any = null;
    let page: any = null;

    return {
        name: 'react-web',

        findById(id: string): ViewElement {
            return createPlaywrightElement(page, `#${id}`);
        },

        findByText(text: string): ViewElement {
            return createPlaywrightElement(page, `text=${text}`);
        },

        findBySelector(selector: string): ViewElement {
            return createPlaywrightElement(page, selector);
        },

        async waitForReady(timeout = 10000): Promise<void> {
            if (!page) {
                browser = await chromium.launch();
                page = await browser.newPage();
            }
            await page.waitForLoadState('domcontentloaded', { timeout });
        },

        async screenshot(name?: string): Promise<void> {
            if (page) {
                await page.screenshot({ path: `${name || 'screenshot'}.png` });
            }
        },

        async cleanup(): Promise<void> {
            if (browser) {
                await browser.close();
                browser = null;
                page = null;
            }
        },
    };
}

function createPlaywrightElement(page: any, selector: string): ViewElement {
    return {
        async tap(): Promise<void> {
            await page.click(selector);
        },

        async longPress(duration = 1000): Promise<void> {
            await page.hover(selector);
            await page.mouse.down();
            await page.waitForTimeout(duration);
            await page.mouse.up();
        },

        async typeText(text: string): Promise<void> {
            await page.fill(selector, text);
        },

        async clearText(): Promise<void> {
            await page.fill(selector, '');
        },

        async scrollTo(direction: 'up' | 'down' | 'left' | 'right'): Promise<void> {
            const scrollAmount = 300;
            const scrollMap = { up: -scrollAmount, down: scrollAmount, left: -scrollAmount, right: scrollAmount };
            await page.evaluate((sel: string, delta: number) => {
                const el = document.querySelector(sel);
                if (el) el.scrollTop += delta;
            }, selector, scrollMap[direction]);
        },

        async exists(): Promise<boolean> {
            const count = await page.locator(selector).count();
            return count > 0;
        },

        async isVisible(): Promise<boolean> {
            return await page.isVisible(selector);
        },

        async getText(): Promise<string> {
            return await page.textContent(selector);
        },

        async getAttributes(): Promise<Record<string, string>> {
            return await page.evaluate((sel: string) => {
                const el = document.querySelector(sel);
                if (!el) return {};
                const attrs: Record<string, string> = {};
                for (const attr of el.attributes) {
                    attrs[attr.name] = attr.value;
                }
                return attrs;
            }, selector);
        },
    };
}

// === Registro automático de adaptadores ===

// Registrar adaptadores automáticamente
const registry = getViewAdapterRegistry();
registry.register(createReactNativeViewAdapter());
registry.register(createReactWebViewAdapter());
