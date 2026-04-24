import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DRAW_STATUS, DrawStatus, DrawType } from '@/types';

interface DrawActionsProps {
  effectiveStatus: DrawStatus;
  onBetsListPress?: (id: string, title: string, draw: DrawType) => void;
  onCreateBetPress?: (id: string, title: string, draw: DrawType) => void;
  draw: DrawType;
}

export const DrawActions: React.FC<DrawActionsProps> = ({
  effectiveStatus,
  onBetsListPress,
  onCreateBetPress,
  draw,
}) => {
  const drawId = String(draw.id);
  const title = draw.name || 'Sorteo';

  const canShowList = effectiveStatus !== DRAW_STATUS.SCHEDULED;
  const canCreateBet = effectiveStatus === DRAW_STATUS.OPEN;

  if (!canShowList && !canCreateBet) return null;

  return (
    <View style={styles.container}>
      {canShowList && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => onBetsListPress?.(drawId, title, draw)}
        >
          <Text style={styles.buttonText}>Ver Apuestas</Text>
        </TouchableOpacity>
      )}
      {canCreateBet && (
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => onCreateBetPress?.(drawId, title, draw)}
        >
          <Text style={[styles.buttonText, styles.primaryText]}>+ Nueva Apuesta</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E9F2',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#00C48C',
    borderColor: '#00C48C',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8F9BB3',
  },
  primaryText: {
    color: '#FFF',
  },
});