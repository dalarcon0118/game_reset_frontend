import React from 'react';
import { View, StyleSheet, TouchableOpacity, GestureResponderEvent } from 'react-native';
import { Briefcase } from 'lucide-react-native';
import { COLORS } from '@/shared/components/constants';
import { Flex, Card, IconBox, Badge, Label, ButtonKit } from '@/shared/components';

interface Operation {
  id: number;
  name: string;
  draw: string;
  total: string;
  net: string;
  loosed: string;
  commission: string;
}

interface OperationCardProps {
  operation: Operation;
  onPress?: () => void;
  onReglamentoPress?: () => void;
}

export const OperationCard: React.FC<OperationCardProps> = ({ operation, onPress, onReglamentoPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.card} padding={0}>
        <View style={[styles.topBar, { backgroundColor: COLORS.primary }]} />

        <Flex align="center" gap={12} style={styles.container}>
          <IconBox>
            <Briefcase size={20} color={COLORS.textLight} />
          </IconBox>

          <Flex vertical flex={1} gap={2} width={"100%"}>
            <Flex justify="between" align="center">
              <Flex vertical gap={2} flex={1}>
                <Label
                  type="header"
                  value={`${operation.name}`}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                />
                <Label
                  type="header"
                  value={`${operation.draw}`}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                />
              </Flex>

            </Flex>

            <Badge content={`Comisión(6%): ${operation.commission}`} textColor={COLORS.primaryDark} color="#E6FFFA" />
            <Flex gap={12} margin={[{ type: "top", value: 12 }]}>
              <Label type="detail" style={styles.detailLabel} value={`Total: ${operation.total}`} />
              <Label type="detail" style={styles.detailLabel} value={`Net: ${operation.net}`} />
              <Label type="detail" style={styles.detailLabel} value={`Perdido: ${operation.loosed}`} />
            </Flex>
            <Flex justify="end">
              <ButtonKit
                label="Reglamento"
                size="small"
                appearance="outline"
                onPress={(e: GestureResponderEvent) => {
                  e?.stopPropagation?.();
                  onReglamentoPress?.();
                }}
                style={styles.reglamentoButton}
              />
            </Flex>
          </Flex>
        </Flex>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 10,
    paddingRight: 10,
    height: 170,
  },
  container: {
    marginTop: 5,
    paddingLeft: 10,
  },
  id: {
    fontSize: 16,
    fontWeight: '200',
    color: COLORS.textDark,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  detailValue: {
    fontWeight: '700',
    color: COLORS.textDark,
  },
  topBar: {
    marginLeft: 14,
    height: 4,
    width: '95%',
  },
  reglamentoButton: {
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 8,
  },
});
