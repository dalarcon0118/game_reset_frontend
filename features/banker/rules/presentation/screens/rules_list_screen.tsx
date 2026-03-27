import React from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Toggle } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { match } from 'ts-pattern';
import { useBankerRulesModel, useBankerRulesDispatch, selectRulesListViewModel, RuleListItemViewModel } from '../../core';
import { Flex, Label, Card } from '@/shared/components';
import { useTheme } from '@/shared/hooks/use_theme';
import { 
  ROUTER_BACK, 
  TOGGLE_RULE_REQUESTED, 
  TOGGLE_RULE_CONFIRMED, 
  TOGGLE_RULE_CANCELLED, 
  NAVIGATE_TO_RULE_UPDATE, 
  NAVIGATE_TO_CREATE, 
  INIT_SCREEN 
} from '../../core/msg';

function RulesList() {
  const { id_structure } = useLocalSearchParams<{ id_structure: string }>();
  const dispatch = useBankerRulesDispatch();
  const model = useBankerRulesModel();
  const { rules: rulesData, confirmToggle } = selectRulesListViewModel(model);
  const { colors } = useTheme();

  // Initialize data load
  React.useEffect(() => {
    dispatch(INIT_SCREEN(id_structure));
  }, [id_structure, dispatch]);

  // Alert based confirmation
  React.useEffect(() => {
    if (confirmToggle) {
      Alert.alert(
        'Confirmar Cambio',
        `¿Estás seguro de que deseas cambiar el estado de ${confirmToggle.ruleName}?`,
        [
          { text: 'Cancelar', onPress: () => dispatch(TOGGLE_RULE_CANCELLED()), style: 'cancel' },
          { text: 'Confirmar', onPress: () => dispatch(TOGGLE_RULE_CONFIRMED(confirmToggle.ruleId, confirmToggle.ruleType as any)) },
        ]
      );
    }
  }, [confirmToggle, dispatch]);

  const renderItem = ({ item }: { item: RuleListItemViewModel }) => (
    <TouchableOpacity onPress={() => dispatch(NAVIGATE_TO_RULE_UPDATE(item.id))}>
      <Card style={styles.ruleCard}>
        <View style={styles.ruleRow}>
          <View style={styles.ruleInfo}>
            <Label type="header" style={styles.ruleName} value={item.name} />
            <Label type="detail" style={styles.ruleDescription} value={item.description} />
          </View>
          <View style={styles.toggleContainer}>
            <Label
              type="detail"
              style={[
                styles.typeLabel,
                { color: item.ruleTypeTone === 'primary' ? colors.primary : colors.success }
              ]}
              value={item.ruleTypeLabel}
            />
            <Toggle
              checked={item.isActive}
              onChange={() => dispatch(TOGGLE_RULE_REQUESTED(item.id, item.ruleType))}
              status={item.ruleTypeTone === 'primary' ? 'primary' : 'success'}
            />
            <Label
              type="detail"
              style={[
                styles.toggleLabel,
                { color: item.isActive ? colors.primary : colors.textSecondary }
              ]}
              value={item.toggleLabel}
            />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return match(rulesData)
    .with({ type: 'Loading' }, () => (
      <Flex flex={1} align="center" justify="center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Label type="detail" value="Cargando reglas..." style={{ marginTop: 16 }} />
      </Flex>
    ))
    .with({ type: 'Failure' }, ({ error }) => (
      <Flex flex={1} align="center" justify="center" padding={20}>
        <Label type="header" value="Error al cargar reglas" />
        <Label type="detail" value={error} />
        <TouchableOpacity onPress={() => dispatch(INIT_SCREEN(id_structure))}>
          <Label type="detail" value="Reintentar" style={{ color: colors.primary, marginTop: 16 }} />
        </TouchableOpacity>
      </Flex>
    ))
    .with({ type: 'Success' }, ({ data }) => (
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />
    ))
    .otherwise(() => null);
}

export default function RulesListScreen() {
  const dispatch = useBankerRulesDispatch();
  const { id_structure } = useLocalSearchParams<{ id_structure?: string }>();
  const { colors } = useTheme();

  React.useEffect(() => {
    dispatch(INIT_SCREEN(id_structure));
  }, [dispatch, id_structure]);

  return (
    <Flex flex={1} background={colors.background}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Flex align="center" gap={16} padding={16} style={styles.header}>
          <TouchableOpacity onPress={() => dispatch(ROUTER_BACK())}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Label type="title" value="Regla del banquero" />
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => dispatch(NAVIGATE_TO_CREATE())}
          >
            <Plus size={24} color={colors.primary} />
          </TouchableOpacity>
        </Flex>
        <RulesList />
      </SafeAreaView>
    </Flex>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  addButton: {
    marginLeft: 'auto',
    padding: 8,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  ruleCard: {
    borderRadius: 12,
  },
  ruleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ruleInfo: {
    flex: 1,
    marginRight: 12,
  },
  ruleName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  ruleDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  toggleContainer: {
    alignItems: 'center',
    gap: 4,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  toggleLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
