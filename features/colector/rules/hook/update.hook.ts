import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { ValidationRuleService, ValidationRule, StructureSpecificRule } from '../../../../shared/services/ValidationRule';
import { useAuth } from '../../../auth';

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
  rule: StructureSpecificRule | null;
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
  const [rule, setRule] = useState<StructureSpecificRule | null>(null);

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
      // Ahora usamos el endpoint específico para obtener una regla por ID
      const ruleData = await ValidationRuleService.getStructureSpecificRuleById(id);

      if (ruleData) {
        setRule(ruleData);
        setFormData({
          name: ruleData.name,
          description: ruleData.description,
          is_active: ruleData.is_active,
          json_logic: ruleData.json_logic || DEFAULT_JSON_LOGIC,
          bet_types: ruleData.bet_types || [],
        });
      } else {
        Alert.alert('Error', 'Regla no encontrada');
      }
    } catch (error) {
      console.error('Error loading rule:', error);
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

      const ruleData = {
        name: formData.name,
        description: formData.description,
        is_active: formData.is_active,
        json_logic: formData.json_logic,
        bet_types: formData.bet_types,
      };

      if (ruleId) {
        // Update existing rule
        await ValidationRuleService.updateStructureRule(ruleId, ruleData);
        Alert.alert('Éxito', 'Regla actualizada correctamente');
      } else {
        // Create new rule - This would need to be implemented in the service
        // For now, we'll show an alert
        Alert.alert('Info', 'Creación de nuevas reglas no implementada aún');
        return;
      }

      // The navigation back is handled in the component

    } catch (error) {
      console.error('Error saving rule:', error);
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
