import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { ValidationRuleRepository } from '@/shared/repositories/validation_rule';
import { ValidationRule as DomainRule } from '@/types/rules';
import { useAuth } from '../../../auth';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('COLECTOR_RULE_UPDATE');

interface RuleUpdateFormData {
  name: string;
  description: string;
  is_active: boolean;
  json_logic: any;
  bet_types: string[];
}

const DEFAULT_JSON_LOGIC = {
  "and": [
    {
      ">": [
        { "var": "bets_input" },
        0
      ]
    },
    {
      "<=": [
        { "var": "amount" },
        1000
      ]
    }
  ]
};

interface UseRuleUpdateReturn {
  // Estados
  loading: boolean;
  saving: boolean;
  rule: DomainRule | null;
  formData: RuleUpdateFormData;

  // Funciones
  handleSave: () => Promise<void>;
  updateFormField: (field: keyof RuleUpdateFormData, value: any) => void;
  updateJsonLogicField: (field: string, value: any) => void;
  loadRule: (id: string) => Promise<void>;
}

export const useRuleUpdate = (ruleId?: string): UseRuleUpdateReturn => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rule, setRule] = useState<DomainRule | null>(null);

  const [formData, setFormData] = useState<RuleUpdateFormData>({
    name: '',
    description: '',
    is_active: true,
    json_logic: DEFAULT_JSON_LOGIC,
    bet_types: [],
  });

  // Load rule data if ruleId is provided
  useEffect(() => {
    if (ruleId) {
      loadRule(ruleId);
    }
  }, [ruleId]);

  const loadRule = useCallback(async (id: string) => {
    try {
      setLoading(true);
      // Ahora usamos el repositorio directamente
      const ruleData = await ValidationRuleRepository.getById(id);

      if (ruleData) {
        setRule(ruleData);
        setFormData({
          name: ruleData.name,
          description: ruleData.description,
          is_active: ruleData.status === 'active',
          json_logic: ruleData.parameters || DEFAULT_JSON_LOGIC,
          bet_types: ruleData.affectedAgencies || [],
        });
      } else {
        Alert.alert('Error', 'Regla no encontrada');
      }
    } catch (error) {
      log.error('Error loading rule', { error, ruleId: id });
      Alert.alert('Error', 'No se pudo cargar la regla');
    } finally {
      setLoading(false);
    }
  }, []);

  const validateFormData = useCallback((): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre de la regla es obligatorio');
      return false;
    }

    if (!formData.description.trim()) {
      Alert.alert('Error', 'La descripción de la regla es obligatoria');
      return false;
    }

    return true;
  }, [formData.name, formData.description]);

  const handleSave = useCallback(async () => {
    // Basic validation
    if (!validateFormData()) {
      return;
    }

    try {
      setSaving(true);

      const updates: Partial<DomainRule> = {
        name: formData.name,
        description: formData.description,
        status: formData.is_active ? 'active' : 'inactive',
        parameters: formData.json_logic,
      };

      if (ruleId) {
        // Update existing rule
        await ValidationRuleRepository.updateStructureRule(ruleId, updates);
        Alert.alert('Éxito', 'Regla actualizada correctamente');
      } else {
        // Create new rule - This would need to be implemented in the repository
        // For now, we'll show an alert
        Alert.alert('Info', 'Creación de nuevas reglas no implementada aún');
        return;
      }

    } catch (error) {
      log.error('Error saving rule', { error, ruleId });
      Alert.alert('Error', 'No se pudo guardar la regla');
    } finally {
      setSaving(false);
    }
  }, [ruleId, formData, validateFormData]);

  const updateFormField = useCallback((field: keyof RuleUpdateFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateJsonLogicField = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      json_logic: {
        ...prev.json_logic,
        [field]: value
      }
    }));
  }, []);

  return {
    // Estados
    loading,
    saving,
    rule,
    formData,

    // Funciones
    handleSave,
    updateFormField,
    updateJsonLogicField,
    loadRule,
  };
};
