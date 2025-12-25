import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Input, Toggle } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react-native';
import { Flex, Label, Card, ButtonKit } from '../../../shared/components';
import { useTheme } from '../../../shared/hooks/useTheme';
import { RuleSelector } from './selector';
import { useRuleUpdate } from './hook/update.hook';

export default function RuleUpdateScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { ruleId } = useLocalSearchParams<{ ruleId: string }>();

  // Usar el custom hook para toda la lógica
  const {
    loading,
    saving,
    rule,
    formData,
    handleSave,
    updateFormField,
    updateJsonLogicField,
  } = useRuleUpdate(ruleId);

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
          <TouchableOpacity onPress={() => router.back()}>
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
                  placeholder="Ej: Límite de monto por número"
                  value={formData.name}
                  onChangeText={(value) => updateFormField('name', value)}
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
                  onChangeText={(value) => updateFormField('description', value)}
                  style={styles.input}
                />
              </Flex>

              {/* Status Toggle */}
              <Flex vertical={false} align="center" justify="between">
                <Label type="detail" value="Regla Activa" />
                <Toggle
                  checked={formData.is_active}
                  onChange={(checked) => updateFormField('is_active', checked)}
                />
              </Flex>

              {/* JSON Logic Configuration */}
              <Card style={styles.logicCard}>
                <Flex vertical gap={spacing.md}>
                  <Label type="header" value="Configuración de Lógica" />

                  {/* Bets Input Configuration */}
                  <RuleSelector
                    jsonLogic={formData.json_logic}
                    onChange={(newLogic: any) => updateFormField('json_logic', newLogic)}
                  />

                  {/* Amount Configuration */}
                  <Flex vertical gap={spacing.xs}>
                    <Label type="detail" value="Condición de Amount" style={styles.inputLabel} />
                    <Flex vertical={false} gap={spacing.sm} align="center">
                      <Label type="detail" value="amount" style={styles.fieldLabel} />
                      <Input
                        placeholder="<="
                        value={Object.keys(formData.json_logic.and?.[1] || {})[0] || '<='}
                        onChangeText={(value) => {
                          const newLogic = { ...formData.json_logic };
                          if (newLogic.and && newLogic.and[1]) {
                            const currentOp = Object.keys(newLogic.and[1])[0];
                            const currentValue = newLogic.and[1][currentOp][1];
                            newLogic.and[1] = { [value]: [{ "var": "amount" }, currentValue] };
                          }
                          updateFormField('json_logic', newLogic);
                        }}
                        style={[styles.input, { flex: 0.5 }]}
                      />
                      <Input
                        placeholder="1000"
                        keyboardType="numeric"
                        value={String(formData.json_logic.and?.[1]?.[Object.keys(formData.json_logic.and?.[1] || {})[0]]?.[1] || 1000)}
                        onChangeText={(value) => {
                          const numValue = parseFloat(value) || 0;
                          const newLogic = { ...formData.json_logic };
                          if (newLogic.and && newLogic.and[1]) {
                            const currentOp = Object.keys(newLogic.and[1])[0];
                            newLogic.and[1][currentOp][1] = numValue;
                          }
                          updateFormField('json_logic', newLogic);
                        }}
                        style={[styles.input, { flex: 1 }]}
                      />
                    </Flex>
                  </Flex>
                </Flex>
              </Card>

              {/* Disclaimer */}
              <View style={styles.disclaimerContainer}>
                <Flex align="start" gap={spacing.sm}>
                  <AlertTriangle size={18} color="#C05621" style={{ marginTop: 2 }} />
                  <Label
                    type="detail"
                    value="Esta regla se aplicará a todas las apuestas que cumplan las condiciones especificadas."
                    style={{ color: '#7B341E', fontSize: 13 }}
                  />
                </Flex>
              </View>

              {/* Save Button */}
              <ButtonKit
                label={saving ? "" : "Guardar Regla"}
                onPress={() => {
                  handleSave();
                  router.back(); // Navigate back after save
                }}
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
  disclaimerContainer: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEEBC8',
  },
});
