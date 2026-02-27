import { Registry } from '../utils/registry';
import { LazyFeature } from './interfaces';
import { DataProvider, AuthProvider, NavigationStrategy, ResourceDefinition } from './interfaces';
import { Plugin } from '../plugins/plugin.types';

// TODO: Define strict ApiClient interface or import from shared types
export type ApiClient = any;

export interface RegistryGroup<T> {
  name: string;
  registry: Registry<T>;
  items: T[];
  getKey?: (item: T) => string;
}

export interface PluginDefinition {
  plugin: Plugin;
  hostStore?: any;
  state?: any;
}

export interface ExtensionDefinition {
  slot: string;
  factory: () => Promise<any> | any;
  adapter?: (feature: any) => any;
  enabled?: boolean | (() => boolean);
}

export interface ModuleManifest {
  name: string;
  imports?: ModuleManifest[];
  registries?: RegistryGroup<any>[];
  features?: LazyFeature[];
  plugins?: PluginDefinition[];
  extensions?: ExtensionDefinition[];
}

export interface KernelAdapters {
  dataProvider: DataProvider;
  authProvider: AuthProvider;
  navigationStrategy: NavigationStrategy;
  apiClient?: ApiClient;
  resources?: ResourceDefinition[];
}

export interface KernelManifest {
  root: ModuleManifest;
  adapters: KernelAdapters;
}
