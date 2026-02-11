// Caso de uso para cargar preferencias del usuario
import { UserProfile, UserPreferences } from '../../domain/models';

export interface LoadPreferencesResult {
  userProfile: UserProfile;
  userPreferences: UserPreferences;
}

export class LoadPreferencesUseCase {
  constructor(
    private userService: IUserService,
    private preferencesService: IPreferencesService
  ) {}

  async execute(): Promise<LoadPreferencesResult> {
    const [userProfile, savedPreferences] = await Promise.all([
      this.userService.getCurrentUser(),
      this.preferencesService.getPreferences()
    ]);

    const userPreferences: UserPreferences = {
      showBalance: savedPreferences?.showBalance ?? true
    };

    return {
      userProfile,
      userPreferences
    };
  }
}

// Interfaces para inversión de dependencias
export interface IUserService {
  getCurrentUser(): Promise<UserProfile>;
}

export interface IPreferencesService {
  getPreferences(): Promise<UserPreferences | null>;
  savePreferences(preferences: UserPreferences): Promise<void>;
}