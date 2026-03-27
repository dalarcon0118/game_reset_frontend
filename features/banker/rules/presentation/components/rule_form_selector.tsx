import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Input, Select, SelectItem, IndexPath } from '@ui-kitten/components';
import { Flex, Label } from '@/shared/components';
import { useTheme } from '@/shared/hooks/use_theme';
import { RuleCategory, ValidationType } from '@/types/rules';

interface RuleFormSelectorProps {
  formData: {
    category: string;
    validationType: string;
    parameters: Record<string, any>;
  };
  categoryOptions: { label: string; value: string }[];
  selectedCategoryPath: IndexPath;
  validationTypeOptions: { label: string; value: string }[];
  selectedValidationTypePath: IndexPath;
  onUpdateFormField: (field: string, value: any) => void;
  onUpdateParameterField: (key: string, value: any) => void;
}

export const RuleFormSelector = ({ 
  formData, 
  categoryOptions, 
  selectedCategoryPath, 
  validationTypeOptions, 
  selectedValidationTypePath, 
  onUpdateFormField, 
  onUpdateParameterField 
}: RuleFormSelectorProps) => {
  const { spacing } = useTheme();

  const onSelectCategory = (index: IndexPath | IndexPath[]) => {
    const idx = Array.isArray(index) ? index[0].row : index.row;
    const value = categoryOptions[idx].value;
    onUpdateFormField('category', value);
  };

  const onSelectValidationType = (index: IndexPath | IndexPath[]) => {
    const idx = Array.isArray(index) ? index[0].row : index.row;
    const value = validationTypeOptions[idx].value;
    onUpdateFormField('validationType', value);
  };

  const renderParameterFields = () => {
    switch (formData.validationType) {
      case 'range_check':
        return (
          <Flex vertical gap={spacing.xs}>
            <Label type="detail" value="Parámetros de Rango" style={styles.inputLabel} />
            <Flex vertical={false} gap={spacing.sm} align="center">
              <Label type="detail" value="Mínimo:" style={styles.fieldLabel} />
              <Input
                placeholder="0"
                keyboardType="numeric"
                value={String(formData.parameters.minAmount || formData.parameters.minValue || '')}
                onChangeText={(value) => onUpdateParameterField('minAmount', parseFloat(value) || 0)}
                style={[styles.input, { flex: 1 }]}
              />
              <Label type="detail" value="Máximo:" style={styles.fieldLabel} />
              <Input
                placeholder="10000"
                keyboardType="numeric"
                value={String(formData.parameters.maxAmount || formData.parameters.maxValue || '')}
                onChangeText={(value) => onUpdateParameterField('maxAmount', parseFloat(value) || 0)}
                style={[styles.input, { flex: 1 }]}
              />
            </Flex>
          </Flex>
        );

      case 'business_rule':
        return (
          <Flex vertical gap={spacing.xs}>
            <Label type="detail" value="Parámetros de Regla de Negocio" style={styles.inputLabel} />
            <Flex vertical={false} gap={spacing.sm} align="center">
              <Label type="detail" value="Horas:" style={styles.fieldLabel} />
              <Input
                placeholder="24"
                keyboardType="numeric"
                value={String(formData.parameters.minAdvanceHours || formData.parameters.hours || '')}
                onChangeText={(value) => onUpdateParameterField('minAdvanceHours', parseFloat(value) || 0)}
                style={[styles.input, { flex: 1 }]}
              />
            </Flex>
          </Flex>
        );

      default:
        return null;
    }
  };

  return (
    <Flex vertical gap={spacing.lg}>
      <Flex vertical gap={spacing.xs}>
        <Label type="detail" value="Categoría" style={styles.inputLabel} />
        <Select
          value={categoryOptions[selectedCategoryPath.row]?.label || 'Seleccionar Categoría'}
          selectedIndex={selectedCategoryPath}
          onSelect={onSelectCategory}
        >
          {categoryOptions.map(cat => (
            <SelectItem key={cat.value} title={cat.label} />
          ))}
        </Select>
      </Flex>

      <Flex vertical gap={spacing.xs}>
        <Label type="detail" value="Tipo de Validación" style={styles.inputLabel} />
        <Select
          value={validationTypeOptions[selectedValidationTypePath.row]?.label || 'Seleccionar Tipo'}
          selectedIndex={selectedValidationTypePath}
          onSelect={onSelectValidationType}
        >
          {validationTypeOptions.map(type => (
            <SelectItem key={type.value} title={type.label} />
          ))}
        </Select>
      </Flex>

      {renderParameterFields()}
    </Flex>
  );
};

const styles = StyleSheet.create({
  inputLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 12,
  },
  input: {
    borderRadius: 8,
  },
});
