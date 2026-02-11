// Caso de uso simplificado para cargar preferencias usando servicios del contexto
import { UserProfile, UserPreferences } from '../../domain/models';
import { SummaryPluginContext } from '../../domain/services';

export interface LoadPreferencesResult {
  userProfile: UserProfile;
  userPreferences: UserPreferences;
}

export class LoadPreferencesUseCase {
  async execute(context: SummaryPluginContext): Promise<LoadPreferencesResult> {
    // Usar los servicios que el host proporciona en el contexto
    const userData = await context.api.get<any>('/auth/me');
    const savedPreferences = await context.storage.getItem('summary-plugin-preferences');

    // Mapear a nuestros modelos de dominio
    const userProfile: UserProfile = {
      id: userData.id || 'unknown',
      name: userData.name || 'Usuario',
      structureId: userData.structure?.id || '1',
      commissionRate: (userData.structure?.commission_rate ?? 0) / 100
    };

    const userPreferences: UserPreferences = {
      showBalance: savedPreferences?.showBalance ?? true
    };

    return {
      userProfile,
      userPreferences
    };
  }
}