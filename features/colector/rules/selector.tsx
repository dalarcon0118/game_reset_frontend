import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Input, Select, SelectItem, IndexPath } from '@ui-kitten/components';
import { Flex, Label } from '@/shared/components';
import { useTheme } from '@/shared/hooks/use_theme';

interface RuleSelectorProps {
  jsonLogic: any;
  onChange: (newJsonLogic: any) => void;
}

const OPERATORS = ['>', '<', '>=', '<=', '==', '!=', 'in'];

export const RuleSelector = ({ jsonLogic, onChange }: RuleSelectorProps) => {
  const { spacing } = useTheme();

  const currentOp = useMemo(() => {
    return Object.keys(jsonLogic.and?.[0] || {})[0] || '>';
  }, [jsonLogic]);

  const selectedIndex = useMemo(() => {
    const index = OPERATORS.indexOf(currentOp);
    return new IndexPath(index >= 0 ? index : 0);
  }, [currentOp]);

  const onSelectOp = (index: IndexPath | IndexPath[]) => {
    const idx = Array.isArray(index) ? index[0].row : index.row;
    const value = OPERATORS[idx];
    
    // Deep clone jsonLogic
    const newLogic = JSON.parse(JSON.stringify(jsonLogic));
    
    // Ensure structure exists
    if (!newLogic.and) newLogic.and = [];
    if (!newLogic.and[0]) {
        newLogic.and[0] = { ">": [{ "var": "bets_input" }, 0] };
    }
    
    if (newLogic.and && newLogic.and[0]) {
      const currentOpKey = Object.keys(newLogic.and[0])[0];
      const currentValue = newLogic.and[0][currentOpKey]?.[1] ?? 0;
      
      let newValue = currentValue;
      if (value === 'in' && !Array.isArray(currentValue)) {
          newValue = [currentValue];
      } else if (value !== 'in' && Array.isArray(currentValue)) {
          newValue = currentValue[0] || 0;
      }
      
      newLogic.and[0] = { [value]: [{ "var": "bets_input" }, newValue] };
    }
    onChange(newLogic);
  };

  const inputValue = useMemo(() => {
    const op = Object.keys(jsonLogic.and?.[0] || {})[0];
    const val = jsonLogic.and?.[0]?.[op]?.[1];
    if (Array.isArray(val)) return val.join(', ');
    return String(val || 0);
  }, [jsonLogic]);

  return (
    <Flex vertical gap={spacing.xs}>
      <Label type="detail" value="Condición de Bets Input" style={styles.inputLabel} />
      <Flex vertical={false} gap={spacing.sm} align="center">
        <Label type="detail" value="Apuesta:" style={styles.fieldLabel} />
        <Select
          style={[styles.input, { flex: 0.5 }]}
          value={currentOp}
          selectedIndex={selectedIndex}
          onSelect={onSelectOp}
        >
          {OPERATORS.map(op => (
            <SelectItem key={op} title={op} />
          ))}
        </Select>
        <Input
          placeholder={currentOp === 'in' ? "Ej: 12, 25, 16" : "0"}
          keyboardType={currentOp === 'in' ? "default" : "numeric"}
          value={inputValue}
          onChangeText={(value) => {
            const newLogic = JSON.parse(JSON.stringify(jsonLogic));
            if (newLogic.and && newLogic.and[0]) {
              const currentOpKey = Object.keys(newLogic.and[0])[0];
              
              let parsedValue: any = 0;
              if (currentOpKey === 'in') {
                  parsedValue = value.split(',')
                      .map(v => v.trim())
                      .filter(v => v !== '')
                      .map(v => parseFloat(v))
                      .filter(n => !isNaN(n));
              } else {
                  parsedValue = parseFloat(value) || 0;
              }

              newLogic.and[0][currentOpKey][1] = parsedValue;
            }
            onChange(newLogic);
          }}
          style={[styles.input, { flex: 1 }]}
        />
      </Flex>
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
