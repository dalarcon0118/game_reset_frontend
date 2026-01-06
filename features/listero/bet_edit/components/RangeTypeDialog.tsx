import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Modal } from '@ui-kitten/components';

interface RangeTypeDialogProps {
  visible: boolean;
  onSelect: (type: 'continuous' | 'terminal') => void;
  onCancel: () => void;
}

export default function RangeTypeDialog({ 
  visible, 
  onSelect, 
  onCancel 
}: RangeTypeDialogProps) {
  return (
    <Modal
      visible={visible}
      backdropStyle={styles.backdrop}
      onBackdropPress={onCancel}
    >
      <Card style={styles.card}>
        <Text category="h6" style={styles.title}>
          Seleccionar tipo de rango
        </Text>
        
        <TouchableOpacity 
          style={styles.option}
          onPress={() => onSelect('continuous')}
        >
          <Text>1. Números continuos</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.option}
          onPress={() => onSelect('terminal')}
        >
          <Text>2. Terminales</Text>
        </TouchableOpacity>
      </Card>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  card: {
    width: 300,
    borderRadius: 8,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  option: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 8,
  },
});