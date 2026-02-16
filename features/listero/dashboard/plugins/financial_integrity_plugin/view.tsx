import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { useFinancialIntegrityStore } from './store';
import { INIT_CONTEXT } from './msg';
import { subscriptions } from './subscriptions';
import { PluginContext } from '@/shared/core/plugins/plugin.types';

export const FinancialIntegrityView: React.FC<{ context: PluginContext }> = ({ context }) => {
  const { model, dispatch } = useFinancialIntegrityStore();

  useEffect(() => {
    dispatch(INIT_CONTEXT(context));
  }, [context, dispatch]);

  // Manejo de suscripciones TEA manual dentro del componente de React
  // (En una app Elm real, esto lo manejaría el runtime)
  useEffect(() => {
    const sub = subscriptions(model);
    // Nota: El motor de plugins suele manejar esto, pero aquí lo hacemos explícito
    // para asegurar que el Watchdog esté activo.
    return () => {
      // Cleanup de suscripciones si fuera necesario
    };
  }, [model, context]);

  if (model.integrityStatus === 'MATCH' || model.integrityStatus === 'NOT_STARTED') {
    return null; // El watchdog es silencioso si todo está bien
  }

  if (model.integrityStatus === 'MISMATCH') {
    const lastDiscrepancy = model.discrepancies[0];
    return (
      <View style={styles.alertContainer}>
        <AlertTriangle color="#FF3D71" size={20} />
        <View style={styles.textContainer}>
          <Text style={styles.alertTitle}>Discrepancia Financiera Detectada</Text>
          <Text style={styles.alertBody}>
            El total local ({lastDiscrepancy?.localValue}) no coincide con el servidor ({lastDiscrepancy?.backendValue}).
          </Text>
        </View>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  alertContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF2F5',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3D71',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  alertTitle: {
    color: '#FF3D71',
    fontWeight: 'bold',
    fontSize: 14,
  },
  alertBody: {
    color: '#FF3D71',
    fontSize: 12,
    marginTop: 2,
  },
});
