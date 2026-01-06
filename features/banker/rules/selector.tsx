import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Input, Select, SelectItem, IndexPath } from '@ui-kitten/components';
import { Flex, Label } from '@/shared/components';
import { useTheme } from '@/shared/hooks/useTheme';
import { RuleCategory, ValidationType } from '@/types/rules';

interface RuleSelectorProps {
  formData: {
    category: string;
    validationType: string;
    parameters: Record<string, any>;
  };
  onUpdateFormField: (field: string, value: any) => void;
  onUpdateParameterField: (key: string, value: any) => void;
}

const CATEGORIES: { label: string; value: RuleCategory }[] = [
  { label: 'Payment Validation', value: 'payment_validation' },
  { label: 'Draw Validation', value: 'draw_validation' },
  { label: 'User Validation', value: 'user_validation' },
  { label: 'Financial Limits', value: 'financial_limits' },
  { label: 'Compliance', value: 'compliance' },
  { label: 'Custom', value: 'custom' },
];

const VALIDATION_TYPES: { label: string; value: ValidationType }[] = [
  { label: 'Range Check', value: 'range_check' },
  { label: 'Format Validation', value: 'format_validation' },
  { label: 'Business Rule', value: 'business_rule' },
  { label: 'Cross Reference', value: 'cross_reference' },
  { label: 'Custom Logic', value: 'custom_logic' },
];

export const RuleSelector = ({ formData, onUpdateFormField, onUpdateParameterField }: RuleSelectorProps) => {
  const { spacing } = useTheme();

  const selectedCategoryIndex = useMemo(() => {
    const index = CATEGORIES.findIndex(cat => cat.value === formData.category);
    return new IndexPath(index >= 0 ? index : 0);
  }, [formData.category]);

  const selectedValidationTypeIndex = useMemo(() => {
    const index = VALIDATION_TYPES.findIndex(type => type.value === formData.validationType);
    return new IndexPath(index >= 0 ? index : 0);
  }, [formData.validationType]);

  const onSelectCategory = (index: IndexPath | IndexPath[]) => {
    const idx = Array.isArray(index) ? index[0].row : index.row;
    const value = CATEGORIES[idx].value;
    onUpdateFormField('category', value);
  };

  const onSelectValidationType = (index: IndexPath | IndexPath[]) => {
    const idx = Array.isArray(index) ? index[0].row : index.row;
    const value = VALIDATION_TYPES[idx].value;
    onUpdateFormField('validationType', value);
  };

  const renderParameterFields = () => {
    switch (formData.validationType) {
      case 'range_check':
        return (
          <Flex vertical gap={spacing.xs}>
            <Label type="detail" value="Range Parameters" style={styles.inputLabel} />
            <Flex vertical={false} gap={spacing.sm} align="center">
              <Label type="detail" value="Min Value:" style={styles.fieldLabel} />
              <Input
                placeholder="0"
                keyboardType="numeric"
                value={String(formData.parameters.minAmount || formData.parameters.minValue || '')}
                onChangeText={(value) => onUpdateParameterField('minAmount', parseFloat(value) || 0)}
                style={[styles.input, { flex: 1 }]}
              />
              <Label type="detail" value="Max Value:" style={styles.fieldLabel} />
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
            <Label type="detail" value="Business Rule Parameters" style={styles.inputLabel} />
            <Flex vertical={false} gap={spacing.sm} align="center">
              <Label type="detail" value="Hours:" style={styles.fieldLabel} />
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
        return (
          <Flex vertical gap={spacing.xs}>
            <Label type="detail" value="Custom Parameters (JSON)" style={styles.inputLabel} />
            <Input
              multiline={true}
              placeholder='{"key": "value"}'
              textStyle={{ minHeight: 80, textAlignVertical: 'top' }}
              value={JSON.stringify(formData.parameters, null, 2)}
              onChangeText={(value) => {
                try {
                  const parsed = JSON.parse(value);
                  // Update all parameters at once
                  Object.keys(parsed).forEach(key => {
                    onUpdateParameterField(key, parsed[key]);
                  });
                } catch (e) {
                  // Invalid JSON, ignore
                }
              }}
              style={styles.input}
            />
          </Flex>
        );
    }
  };

  return (
    <Flex vertical gap={spacing.md}>
      <Label type="header" value="Rule Configuration" />

      {/* Category Selection */}
      <Flex vertical gap={spacing.xs}>
        <Label type="detail" value="Category" style={styles.inputLabel} />
        <Select
          style={styles.input}
          value={CATEGORIES[selectedCategoryIndex.row]?.label || 'Select Category'}
          selectedIndex={selectedCategoryIndex}
          onSelect={onSelectCategory}
        >
          {CATEGORIES.map(category => (
            <SelectItem key={category.value} title={category.label} />
          ))}
        </Select>
      </Flex>

      {/* Validation Type Selection */}
      <Flex vertical gap={spacing.xs}>
        <Label type="detail" value="Validation Type" style={styles.inputLabel} />
        <Select
          style={styles.input}
          value={VALIDATION_TYPES[selectedValidationTypeIndex.row]?.label || 'Select Type'}
          selectedIndex={selectedValidationTypeIndex}
          onSelect={onSelectValidationType}
        >
          {VALIDATION_TYPES.map(type => (
            <SelectItem key={type.value} title={type.label} />
          ))}
        </Select>
      </Flex>

      {/* Dynamic Parameters */}
      {renderParameterFields()}
    </Flex>
  );
};

const styles = StyleSheet.create({
  inputLabel: {
    fontWeight: '600',
    color: '#4A5568',
    marginLeft: 2,
  },
  fieldLabel: {
    fontWeight: '700',
    color: '#2D3748',
    minWidth: 80,
  },
  input: {
    minWidth: 80,
    backgroundColor: '#F7FAFC',
  },
});
