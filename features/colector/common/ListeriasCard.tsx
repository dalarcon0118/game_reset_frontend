import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '@ui-kitten/components';
import { Briefcase } from 'lucide-react-native';
import { COLORS } from './constants';
import { Card } from '../../../shared/components/Card';
import { IconBox } from '../../../shared/components/IconBox';
import { Badge } from '../../../shared/components/Badge';
import { Flex } from '../../../shared/components/Flex';

interface Operation {
  id: string;
  net: string;
  gross: string;
  commission: string;
}

interface OperationCardProps {
  operation: Operation;
}

export const ListeriasCard: React.FC<OperationCardProps> = ({ operation }) => {
  return (
    <Card style={styles.container}>
      <Flex align="center">
        <IconBox>
            <Briefcase size={20} color={COLORS.textLight} />
        </IconBox>
        
        <View style={styles.details}>
            <Text style={styles.id}>Operation #{operation.id}</Text>
            <Flex style={styles.amountsRow}>
              <Text style={styles.detailLabel}>Net: <Text style={styles.detailValue}>{operation.net}</Text></Text>
              <Text style={[styles.detailLabel, { marginLeft: 12 }]}>Gross: <Text style={styles.detailValue}>{operation.gross}</Text></Text>
            </Flex>
        </View>
        
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
  details: {
    flex: 1,
    marginLeft: 12,
  },
  id: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  amountsRow: {
    marginTop: 4,
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
