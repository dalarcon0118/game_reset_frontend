import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { Input, Select, SelectItem, IndexPath } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { match } from 'ts-pattern';
import { Flex, Label, Card } from '@/shared/components';
import { useTheme } from '@/shared/hooks/use_theme';
import { 
  useBankerRulesModel, 
  useBankerRulesDispatch, 
  selectRuleEditViewModel, 
  INIT_SCREEN,
  FORM_FIELD_UPDATED,
  ROUTER_BACK,
  PARAMETER_FIELD_UPDATED,
  SAVE_RULE_REQUESTED
} from '../../core';
import { RuleFormSelector } from '../components/rule_form_selector';
import { RemoteData } from '@core/tea-utils';

export default function RuleUpdateScreen() {
  const { colors, spacing } = useTheme();
  const params = useLocalSearchParams<{ id?: string | string[]; ruleId?: string | string[] }>();
  const routeRuleId = Array.isArray(params.id) ? params.id[0] : params.id;
  const legacyRuleId = Array.isArray(params.ruleId) ? params.ruleId[0] : params.ruleId;
  const ruleId = routeRuleId ?? legacyRuleId;
  const hasValidRuleId = typeof ruleId === 'string' && ruleId.trim().length > 0;

  const model = useBankerRulesModel();
  const dispatch = useBankerRulesDispatch();
  const {
    data,
    saving,
    statusOptions,
    selectedStatusIndex,
    selectedStatusPath,
    categoryOptions,
    selectedCategoryPath,
    validationTypeOptions,
    selectedValidationTypePath,
  } = selectRuleEditViewModel(model);

  React.useEffect(() => {
    if (!hasValidRuleId || !ruleId) return;
    dispatch(INIT_SCREEN(undefined, ruleId));
  }, [hasValidRuleId, ruleId, dispatch]);

  const onSelectStatus = (index: IndexPath | IndexPath[]) => {
    const idx = Array.isArray(index) ? index[0].row : index.row;
    const value = statusOptions[idx].value;
    dispatch(FORM_FIELD_UPDATED('status', value));
  };

  const isSaving = RemoteData.isLoading(saving);

  const header = (
    <Flex align="center" gap={spacing.md} padding={spacing.lg} style={styles.header}>
      <TouchableOpacity onPress={() => dispatch(ROUTER_BACK())}>
        <ArrowLeft size={24} color={colors.text} />
      </TouchableOpacity>
      <Label type="title" value={ruleId ? 'Editar Regla' : 'Nueva Regla'} />
      <TouchableOpacity 
        style={styles.saveButton} 
        onPress={() => dispatch(SAVE_RULE_REQUESTED())}
        disabled={isSaving || !hasValidRuleId}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Label type="detail" value="GUARDAR" style={{ color: colors.primary, fontWeight: 'bold' }} />
        )}
      </TouchableOpacity>
    </Flex>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Flex vertical flex={1}>
        {header}
        {!hasValidRuleId ? (
          <Flex flex={1} vertical justify="center" align="center" padding={spacing.lg}>
            <Label type="header" value="ID inválido" />
            <Label type="detail" value="No se encontró un identificador de regla válido." />
            <TouchableOpacity onPress={() => dispatch(ROUTER_BACK())}>
              <Label type="detail" value="Volver" style={{ color: colors.primary, marginTop: spacing.md }} />
            </TouchableOpacity>
          </Flex>
        ) : (
          match(data)
          .with({ type: 'Loading' }, () => (
            <Flex flex={1} vertical justify="center" align="center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Label type="detail" value="Cargando regla..." style={{ marginTop: spacing.md }} />
            </Flex>
          ))
          .with({ type: 'Failure' }, ({ error }) => (
            <Flex flex={1} vertical justify="center" align="center" padding={spacing.lg}>
              <Label type="header" value="Error" />
              <Label type="detail" value={error} />
              <TouchableOpacity onPress={() => dispatch(INIT_SCREEN(undefined, ruleId))}>
                <Label type="detail" value="Reintentar" style={{ color: colors.primary, marginTop: spacing.md }} />
              </TouchableOpacity>
            </Flex>
          ))
          .with({ type: 'Success' }, ({ data: { formData } }) => (
            <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
              <Card style={styles.formCard}>
                <Flex vertical gap={spacing.lg}>
                  {/* Basic Information */}
                  <Flex vertical gap={spacing.xs}>
                    <Label type="detail" value="Nombre de la Regla" style={styles.inputLabel} />
                    <Input
                      placeholder="Ej: Límite de monto por pago"
                      value={formData.name}
                      onChangeText={(value) => dispatch(FORM_FIELD_UPDATED('name', value))}
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
                      onChangeText={(value) => dispatch(FORM_FIELD_UPDATED('description', value))}
                      style={styles.input}
                    />
                  </Flex>

                  {/* Status & Category */}
                  <Flex vertical={false} gap={spacing.md}>
                    <Flex vertical flex={1} gap={spacing.xs}>
                      <Label type="detail" value="Estado" style={styles.inputLabel} />
                      <Select
                        selectedIndex={selectedStatusPath}
                        onSelect={onSelectStatus}
                        value={statusOptions[selectedStatusIndex].label}
                      >
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} title={opt.label} />
                        ))}
                      </Select>
                    </Flex>
                  </Flex>

                  {/* Dynamic Rule Config */}
                  <View style={styles.separator} />
                  <RuleFormSelector 
                    formData={formData}
                    categoryOptions={categoryOptions}
                    selectedCategoryPath={selectedCategoryPath}
                    validationTypeOptions={validationTypeOptions}
                    selectedValidationTypePath={selectedValidationTypePath}
                    onUpdateFormField={(field, value) => dispatch(FORM_FIELD_UPDATED(field as any, value))}
                    onUpdateParameterField={(key, value) => dispatch(PARAMETER_FIELD_UPDATED(key, value))}
                  />
                </Flex>
              </Card>
            </ScrollView>
          ))
          .otherwise(() => null)
        )}
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
    borderBottomColor: '#f0f0f0',
  },
  saveButton: {
    marginLeft: 'auto',
    padding: 8,
  },
  formCard: {
    borderRadius: 16,
    padding: 4,
  },
  inputLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    borderRadius: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
});
