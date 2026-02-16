// Caso de uso simplificado para cargar preferencias usando servicios del contexto
import { UserProfile, UserPreferences } from '../../domain/models';
import { SummaryPluginContext } from '../../domain/services';
import { UserProfileExternalCodec, UserPreferencesExternalCodec, decodeOrFallback } from '../../domain/codecs';

export interface LoadPreferencesResult {
  userProfile: UserProfile;
  userPreferences: UserPreferences;
}

export class LoadPreferencesUseCase {
  async execute(context: SummaryPluginContext): Promise<LoadPreferencesResult> {
    // Usar los servicios que el host proporciona en el contexto
    const userDataRaw = await context.api.get<any>('/auth/me');
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

    // Mapear a nuestros modelos de dominio (UserProfile y UserPreferences ya están tipados por io-ts)
    const userProfile: UserProfile = {
      id: String(userData.id),
      name: userData.name || userData.username || 'Usuario',
      structureId: String(userData.structure?.id || '1'),
      commissionRate: (userData.structure?.commission_rate ?? 0) / 100
    };

    const userPreferences: UserPreferences = {
      showBalance: savedPreferences.showBalance ?? true
    };

    return {
      userProfile,
      userPreferences
    };
  }
}