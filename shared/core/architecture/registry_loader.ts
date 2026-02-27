import { Registry } from '../utils/registry';
import { logger } from '../utils/logger';

export interface RegistryDefinition<T = any> {
  name: string;
  registry: Registry<T>;
  items: Array<T>;
  enabled?: boolean;
  priority?: number;
}

export interface RegistryLoaderConfig {
  registries: Array<RegistryDefinition>;
}

export class RegistryLoader {
  private config: RegistryLoaderConfig;

  constructor(config: RegistryLoaderConfig) {
    this.config = config;
  }

  async load(): Promise<void> {
    logger.info('Loading registries...', 'REGISTRY_LOADER');
    
    const enabledRegistries = this.config.registries
      .filter(registry => registry.enabled !== false)
      .sort((a, b) => (a.priority || 0) - (b.priority || 0));

    for (const definition of enabledRegistries) {
      try {
        await this.loadRegistry(definition);
      } catch (error) {
        logger.error(
          `Failed to load registry: ${definition.name}`,
          'REGISTRY_LOADER',
          error
        );
        throw error;
      }
    }

    logger.info('All registries loaded successfully', 'REGISTRY_LOADER');
  }

  private async loadRegistry(definition: RegistryDefinition): Promise<void> {
    logger.info(`Loading registry: ${definition.name}`, 'REGISTRY_LOADER');
    
    const { registry, items } = definition;
    
    for (const item of items) {
      try {
        registry.register(item);
        logger.debug(
          `Registered item in ${definition.name}`,
          'REGISTRY_LOADER',
          { item: typeof item === 'object' ? item.constructor?.name || 'Unknown' : String(item) }
        );
      } catch (error) {
        logger.error(
          `Failed to register item in ${definition.name}`,
          'REGISTRY_LOADER',
          error
        );
        throw error;
      }
    }
  }

  static create(config: RegistryLoaderConfig): RegistryLoader {
    return new RegistryLoader(config);
  }
}