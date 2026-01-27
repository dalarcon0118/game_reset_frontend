import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../auth';
import { useDataFetch } from '../../../../shared/hooks/useDataFetch';
import { ValidationRuleService, StructureSpecificRule, RuleRepository } from '../../../../shared/services/ValidationRule';

interface ModulesState {
  notifications: boolean;
  analytics: boolean;
  realTimeUpdates: boolean;
  offlineMode: boolean;
}

interface TemplateWithStatus extends RuleRepository {
  isActivated: boolean;
  specificRuleId?: string;
}

interface UseSettingsReturn {
  // Estados
  expandedSection: string | null;
  refreshing: boolean;
  modules: ModulesState;
  rules: TemplateWithStatus[] | null;
  rulesLoading: boolean;
  rulesError: any;

  // Funciones
  toggleSection: (section: string) => void;
  onRefresh: () => Promise<void>;
  onRetryRules: () => void;
  handleToggleModule: (key: keyof ModulesState) => void;
  handleModifyRule: (rule: TemplateWithStatus) => void;
  handleToggleRuleStatus: (rule: TemplateWithStatus, checked: boolean) => Promise<void>;
}

export const useSettings = (): UseSettingsReturn => {
  const router = useRouter();
  const { user, checkLoginStatus } = useAuth();

  // Estados locales
  const [expandedSection, setExpandedSection] = useState<string | null>('user');
  const [refreshing, setRefreshing] = useState(false);
  const [modules, setModules] = useState<ModulesState>({
    notifications: true,
    analytics: false,
    realTimeUpdates: true,
    offlineMode: false,
  });
  const [rules, setRules] = useState<TemplateWithStatus[] | null>(null);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesError, setRulesError] = useState<any>(null);

  // Función para obtener la estructura del usuario actual
  const getCurrentUserStructureId = useCallback(async (): Promise<string | null> => {
    try {
      // Usar la estructura del usuario del contexto de autenticación
      return user?.structure?.id?.toString() || null;
    } catch (error) {
      console.error('Error getting user structure:', error);
      return null;
    }
  }, [user]);

  // Función para cargar y combinar templates con reglas específicas
  const loadRules = useCallback(async () => {
    setRulesLoading(true);
    setRulesError(null);

    try {
      // Cargar templates disponibles
      const templates = await ValidationRuleService.getAvailableTemplates();

      // Obtener estructura del usuario actual
      const structureId = await getCurrentUserStructureId();

      if (!structureId) {
        // Si no hay estructura, mostrar todas las templates como desactivadas
        const templatesWithStatus: TemplateWithStatus[] = templates.map(template => ({
          ...template,
          isActivated: false,
        }));
        setRules(templatesWithStatus);
        return;
      }

      // Cargar reglas específicas de la estructura actual
      const specificRules = await ValidationRuleService.getByStructure(structureId);

      // Combinar templates con estado de activación
      const templatesWithStatus: TemplateWithStatus[] = templates.map(template => {
        // Buscar si esta template ya está activada en las reglas específicas
        const activatedRule = specificRules.find(rule => rule.base_template === template.id);

        return {
          ...template,
          isActivated: !!activatedRule,
          specificRuleId: activatedRule?.id,
        };
      });

      setRules(templatesWithStatus);
    } catch (error) {
      console.error('Error loading rules:', error);
      setRulesError(error);
    } finally {
      setRulesLoading(false);
    }
  }, [getCurrentUserStructureId]);

  // Fetch inicial de reglas
  useEffect(() => {
    loadRules();
  }, [loadRules]);

  // Toggle de secciones del accordion
  const toggleSection = useCallback((section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  }, []);

  // Refresh de datos
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        checkLoginStatus(),
        loadRules()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [checkLoginStatus, loadRules]);

  // Toggle de módulos
  const handleToggleModule = useCallback((key: keyof ModulesState) => {
    setModules(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Modificar regla - navega a la pantalla de edición
  const handleModifyRule = useCallback((rule: TemplateWithStatus) => {
    if (rule.isActivated && rule.specificRuleId) {
      // Si está activada, modificar la regla específica
      router.push(`/colector/update_rule?ruleId=${rule.specificRuleId}`);
    } else {
      // Si no está activada, navegar con templateId para crear nueva
      router.push(`/colector/update_rule?templateId=${rule.id}`);
    }
  }, [router]);

  // Toggle del status de una regla - activar/desactivar regla específica
  const handleToggleRuleStatus = useCallback(async (rule: TemplateWithStatus, checked: boolean) => {
    try {
      const structureId = await getCurrentUserStructureId();
      if (!structureId) {
        throw new Error('No se pudo obtener la estructura del usuario');
      }

      if (checked) {
        // Activar: Copiar template a regla específica
        const newRule = await ValidationRuleService.copyTemplateToStructure(
          rule.id,
          structureId,
          { apply_to_all_children: false }
        );

        // Actualizar estado local
        setRules(prevRules =>
          prevRules?.map(r =>
            r.id === rule.id
              ? { ...r, isActivated: true, specificRuleId: newRule.id }
              : r
          ) || null
        );
      } else {
        // Desactivar: Eliminar regla específica
        if (rule.specificRuleId) {
          await ValidationRuleService.deleteStructureRule(rule.specificRuleId);

          // Actualizar estado local
          setRules(prevRules =>
            prevRules?.map(r =>
              r.id === rule.id
                ? { ...r, isActivated: false, specificRuleId: undefined }
                : r
            ) || null
          );
        }
      }
    } catch (error) {
      console.error('Error toggling rule status:', error);
      // Recargar datos para asegurar consistencia
      loadRules();
      // Mostrar notificación de error al usuario
      Alert.alert(
        'Error',
        'No se pudo cambiar el estado de la regla. Por favor, inténtalo de nuevo.'
      );
    }
  }, [getCurrentUserStructureId, loadRules]);

  return {
    // Estados
    expandedSection,
    refreshing,
    modules,
    rules,
    rulesLoading,
    rulesError,

    // Funciones
    toggleSection,
    onRefresh,
    onRetryRules: loadRules,
    handleToggleModule,
    handleModifyRule,
    handleToggleRuleStatus,
  };
};
