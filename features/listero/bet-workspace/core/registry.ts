import { BetFeature } from '@/shared/core/architecture/interfaces';

export { BetFeature };

export const BetFeatureRegistry = {
  features: new Map<string, BetFeature>(),
  
  register(feature: BetFeature) {
    this.features.set(feature.key, feature);
  },
  
  get(key: string): BetFeature | undefined {
    return this.features.get(key);
  },
  
  list(): BetFeature[] {
    return Array.from(this.features.values());
  }
};