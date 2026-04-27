export interface FeatureAdapter<TFeatureMsg, TGlobalMsg> {
  lift: (msg: TFeatureMsg) => TGlobalMsg;
  lower: (msg: TGlobalMsg) => TFeatureMsg | null;
}

export interface Feature<TModel, TMsg, TCmd = unknown> {
  id: string;
  adapter: FeatureAdapter<TMsg, unknown>;
  init?: () => [TModel, TCmd | null] | [TModel];
  update?: (msg: TMsg, state: TModel) => [TModel, TCmd | null] | [TModel];
}

export interface BetFeature {
  key: string;
  prepareForSave?: (model: unknown) => unknown;
  getEmptyState?: () => unknown;
  identifyBetTypes?: (betTypes: unknown[]) => Record<string, string | null>;
  transformBets?: (bets: unknown[], identifiedBetTypes?: Record<string, string | null>) => unknown;
  handles?: (code: string) => boolean;
  isValidInput?: (input: string, gameTypeCode: string) => boolean;
  getMaxLength?: (gameTypeCode: string) => number;
}