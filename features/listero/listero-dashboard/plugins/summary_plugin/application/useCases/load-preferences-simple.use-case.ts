// Caso de uso simplificado para cargar preferencias usando servicios del contexto
import { UserProfile, UserPreferences } from '../../domain/models';
import { SummaryPluginContext } from '../../domain/services';
import { UserProfileExternalCodec, UserPreferencesExternalCodec, decodeOrFallback } from '../../domain/codecs';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('LOAD_PREFERENCES_USE_CASE');

export interface LoadPreferencesResult {
  userProfile: UserProfile;
  userPreferences: UserPreferences;
}

/**
 * Extrae el structureId del contexto del host.
 * Este es el mismo método que usa draws_list_plugin para mantener consistencia.
 */
function extractStructureIdFromContext(context: SummaryPluginContext): string | null {
  // Soporta múltiples esquemas de host
  return (
    context.state?.user?.owner_structure ||
    context.state?.currentUser?.structureId ||
    context.state?.userStructureId ||
    null
  );
}

export class LoadPreferencesUseCase {
  async execute(context: SummaryPluginContext): Promise<LoadPreferencesResult> {
    // Extraer structureId del contexto primero (fuente autoritativa para el ledger)
    const contextStructureId = extractStructureIdFromContext(context);

    log.debug('Extracting structureId from context', {
      contextStructureId,
      contextKeys: Object.keys(context.state || {})
    });

    // Usar los servicios que el host proporciona en el contexto
    // Verificación defensiva
    if (!context.api || typeof context.api.get !== 'function') {
      console.warn('LoadPreferencesUseCase: context.api or context.api.get is not available', context);
      // Usar structureId del contexto si está disponible
      return {
        userProfile: {
          id: 'unknown',
          name: 'Usuario (Offline)',
          structureId: contextStructureId || '1',
          commissionRate: 0.1
        },
        userPreferences: { showBalance: true }
      };
    }

    let userDataRaw: any = {};
    try {
      userDataRaw = await context.api.get<any>('auth/me');
    } catch (error) {
      console.warn('LoadPreferencesUseCase: Error fetching user data', error);
      // Continuar con estructura del contexto
    }

    const savedPreferencesRaw = await context.storage.getItem('summary-plugin-preferences');

    // Validar y decodificar datos externos con io-ts
    const userData = decodeOrFallback(
      UserProfileExternalCodec,
      userDataRaw,
      'UserProfile',
      { id: 'unknown', username: 'usuario', name: 'Usuario', structure: { id: '1', commission_rate: 10 } }
    );

    // Si no hay preferencias guardadas (null), usamos el objeto vacío para que io-ts use el fallback
    // o simplemente pasamos el valor si existe.
    const savedPreferences = decodeOrFallback(
      UserPreferencesExternalCodec,
      savedPreferencesRaw || {},
      'UserPreferences',
      { showBalance: true }
    );

    // PRIORITY: Usar structureId del contexto primero (es la fuente autoritativa para el ledger)
    // Luego caer a la API, y finalmente al default '1'
    const finalStructureId = contextStructureId
      ? String(contextStructureId)
      : String(userData.structure?.id || '1');

    // Mapear a nuestros modelos de dominio (UserProfile y UserPreferences ya están tipados por io-ts)
    const userProfile: UserProfile = {
      id: String(userData.id),
      name: userData.name || userData.username || 'Usuario',
      structureId: finalStructureId,
      commissionRate: (userData.structure?.commission_rate ?? 0) / 100
    };

    const userPreferences: UserPreferences = {
      showBalance: savedPreferences.showBalance ?? true
    };

    log.debug('Preferences loaded', {
      structureId: finalStructureId,
      contextStructureId,
      hasApiData: !!userDataRaw.id
    });

    return {
      userProfile,
      userPreferences
    };
  }
}