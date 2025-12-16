import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '@ui-kitten/components';
import { Briefcase } from 'lucide-react-native';
import { COLORS } from './constants';
import { Flex } from '../../../shared/components/Flex';
import { Card } from '../../../shared/components/Card';
import { IconBox } from '../../../shared/components/IconBox';
import { Badge } from '../../../shared/components/Badge';

interface Operation {
  id: string;
  net: string;
  gross: string;
  commission: string;
}

interface OperationCardProps {
  operation: Operation;
}

export const OperationCard: React.FC<OperationCardProps> = ({ operation }) => {
  return (
    <Card style={styles.container}>
      <Flex align="center" gap={12}>
        <IconBox>
            <Briefcase size={20} color={COLORS.textLight} />
        </IconBox>
        
        <Flex vertical flex={1} gap={4}>
            <Text style={styles.id}>Operation #{operation.id}</Text>
            <Flex gap={12}>
              <Text style={styles.detailLabel}>Net: <Text style={styles.detailValue}>{operation.net}</Text></Text>
              <Text style={styles.detailLabel}>Gross: <Text style={styles.detailValue}>{operation.gross}</Text></Text>
            </Flex>
        </Flex>

        <Badge>
            Comm (6%): {operation.commission}
        </Badge>
      </Flex>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F2F5',
    // Removed duplicate shadow styles, handled by Card
  },
  id: {
    fontSize: 14,
    fontWeight: '600',
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
});
