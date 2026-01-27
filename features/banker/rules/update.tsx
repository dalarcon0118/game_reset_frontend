import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Input, Toggle, Select, SelectItem, IndexPath } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react-native';
import { Flex, Label, Card, ButtonKit } from '@/shared/components';
import { useTheme } from '@/shared/hooks/useTheme';
import { useRuleStore, selectLoading, selectSaving, selectFormData } from './store';
import { RuleSelector } from './selector';

export default function RuleUpdateScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { ruleId } = useLocalSearchParams<{ ruleId: string }>();

  const loading = useRuleStore(selectLoading);
  const saving = useRuleStore(selectSaving);
  const formData = useRuleStore(selectFormData);
  const dispatch = useRuleStore(state => state.dispatch);

  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Draft', value: 'draft' },
  ];

  const selectedStatusIndex = React.useMemo(() => {
    const index = statusOptions.findIndex(opt => opt.value === formData.status);
    return new IndexPath(index >= 0 ? index : 0);
  }, [formData.status]);

  const onSelectStatus = (index: IndexPath | IndexPath[]) => {
    const idx = Array.isArray(index) ? index[0].row : index.row;
    const value = statusOptions[idx].value;
    dispatch({ type: 'FORM_FIELD_UPDATED', field: 'status', value });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Flex flex={1} vertical justify="center" align="center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Label type="detail" value="Cargando regla..." style={{ marginTop: spacing.md }} />
        </Flex>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Flex vertical flex={1}>
        {/* Header */}
        <Flex align="center" gap={spacing.md} padding={spacing.lg} style={styles.header}>
          <TouchableOpacity onPress={() => dispatch({ type: 'ROUTER_BACK' })}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Label type="title" value={ruleId ? 'Editar Regla' : 'Nueva Regla'} />
        </Flex>

        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          <Card style={styles.formCard}>
            <Flex vertical gap={spacing.lg}>
              {/* Basic Information */}
              <Flex vertical gap={spacing.xs}>
                <Label type="detail" value="Nombre de la Regla" style={styles.inputLabel} />
                <Input
                  placeholder="Ej: Límite de monto por pago"
                  value={formData.name}
                  onChangeText={(value) => dispatch({ type: 'FORM_FIELD_UPDATED', field: 'name', value })}
                  style={styles.input}
                />
              </Flex>

              <Flex vertical gap={spacing.xs}>
                <Label type="detail" value="Descripción" style={styles.inputLabel} />
                <Input
                  multiline={true}
                  placeholder="Describe qué valida esta regla..."
                  textStyle={{ minHeight: 80, textAlignVertical: 'top' }}
                  value={formData.description}
                  onChangeText={(value) => dispatch({ type: 'FORM_FIELD_UPDATED', field: 'description', value })}
                  style={styles.input}
                />
              </Flex>

              {/* Status Selection */}
              <Flex vertical gap={spacing.xs}>
                <Label type="detail" value="Estado" style={styles.inputLabel} />
                <Select
                  style={styles.input}
                  value={statusOptions[selectedStatusIndex.row]?.label || 'Select Status'}
                  selectedIndex={selectedStatusIndex}
                  onSelect={onSelectStatus}
                >
                  {statusOptions.map(status => (
                    <SelectItem key={status.value} title={status.label} />
                  ))}
                </Select>
              </Flex>

              {/* Rule Configuration */}
              <Card style={styles.logicCard}>
                <RuleSelector
                  formData={{
                    category: formData.category,
                    validationType: formData.validationType,
                    parameters: formData.parameters,
                  }}
                  onUpdateFormField={(field: string, value: any) => dispatch({ type: 'FORM_FIELD_UPDATED', field: field as any, value })}
                  onUpdateParameterField={(key: string, value: any) => dispatch({ type: 'PARAMETER_FIELD_UPDATED', key, value })}
                />
              </Card>

              {/* Scope Configuration */}
              <Card style={styles.scopeCard}>
                <Flex vertical gap={spacing.md}>
                  <Label type="header" value="Alcance de la Regla" />

                  <Flex vertical={false} align="center" justify="between">
                    <Label type="detail" value="Aplicar a todas las agencias" />
                    <Toggle
                      checked={formData.scope.allAgencies}
                      onChange={(checked) => dispatch({ type: 'SCOPE_FIELD_UPDATED', field: 'allAgencies', value: checked })}
                    />
                  </Flex>

                  {!formData.scope.allAgencies && (
                    <Flex vertical gap={spacing.xs}>
                      <Label type="detail" value="Agencias específicas (separadas por coma)" style={styles.inputLabel} />
                      <Input
                        placeholder="agency1, agency2, agency3"
                        value={formData.scope.agencyIds.join(', ')}
                        onChangeText={(value) => {
                          const agencyIds = value.split(',')
                            .map(id => id.trim())
                            .filter(id => id.length > 0);
                          dispatch({ type: 'SCOPE_FIELD_UPDATED', field: 'agencyIds', value: agencyIds });
                        }}
                        style={styles.input}
                      />
                    </Flex>
                  )}
                </Flex>
              </Card>

              {/* Examples */}
              <Flex vertical gap={spacing.xs}>
                <Label type="detail" value="Ejemplos (uno por línea)" style={styles.inputLabel} />
                <Input
                  multiline={true}
                  placeholder="Ejemplo 1: Pago de $500 (válido)&#10;Ejemplo 2: Pago de $15000 (inválido)"
                  textStyle={{ minHeight: 100, textAlignVertical: 'top' }}
                  value={formData.examples.join('\n')}
                  onChangeText={(value) => {
                    const examples = value.split('\n').filter(ex => ex.trim().length > 0);
                    dispatch({ type: 'FORM_FIELD_UPDATED', field: 'examples', value: examples });
                  }}
                  style={styles.input}
                />
              </Flex>

              {/* Disclaimer */}
              <View style={styles.disclaimerContainer}>
                <Flex align="start" gap={spacing.sm}>
                  <AlertTriangle size={18} color="#C05621" style={{ marginTop: 2 }} />
                  <Label
                    type="detail"
                    value="Esta regla se aplicará a todas las transacciones que cumplan las condiciones especificadas dentro de su alcance."
                    style={{ color: '#7B341E', fontSize: 13 }}
                  />
                </Flex>
              </View>

              {/* Save Button */}
              <ButtonKit
                label={saving ? "" : "Guardar Regla"}
                onPress={() => dispatch({ type: 'SAVE_RULE_REQUESTED' })}
                status="primary"
                disabled={saving}
                accessoryLeft={saving ? () => <ActivityIndicator size="small" color="#FFF" /> : () => <Save size={18} color="#FFF" />}
                style={{ marginTop: spacing.md }}
              />
            </Flex>
          </Card>
        </ScrollView>
      </Flex>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  formCard: {
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  logicCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scopeCard: {
    backgroundColor: '#FEFCF3',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  inputLabel: {
    fontWeight: '600',
    color: '#4A5568',
    marginLeft: 2,
  },
  input: {
    minWidth: 80,
    backgroundColor: '#F7FAFC',
  },
  disclaimerContainer: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEEBC8',
  },
});
