import { PluginContext } from '@/shared/core/plugins/plugin.types';
import { FinancialSummary } from '@/types';
import { Result } from 'neverthrow';

/**
 * Interfaz que define los servicios específicos que el SummaryPlugin
 * requiere que el host le proporcione a través del contexto.
 */
export interface SummaryPluginServices {
  FinancialSummaryService: {
    get: (structureId: string | number, date?: string) => Promise<Result<FinancialSummary, Error>>;
  };
}

/**
 * Tipo que extiende el PluginContext básico con los servicios requeridos por este plugin.
 */
export type SummaryPluginContext = PluginContext & {
  api: SummaryPluginServices;
};
