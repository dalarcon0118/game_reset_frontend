import React from 'react';
import { View, StyleSheet, TouchableOpacity, GestureResponderEvent } from 'react-native';
import { Building2, Users, DollarSign } from 'lucide-react-native';
import { COLORS } from '../../../shared/components/constants';
import { Flex, Card, IconBox, Badge, Label, ButtonKit } from '../../../shared/components';

interface Agency {
  id: number;
  name: string;
  total_collected: number;
  net_collected: number;
  premiums_paid: number;
  commissions: number;
  status: string;
  active_draws: number;
}

interface AgencyCardProps {
  agency: Agency;
  onPress?: () => void;
  onRulesPress?: () => void;
}

export const AgencyCard: React.FC<AgencyCardProps> = ({ agency, onPress, onRulesPress }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return COLORS.success;
      case 'inactive':
        return COLORS.warning;
      case 'suspended':
        return COLORS.danger;
      default:
        return COLORS.primary;
    }
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.card} padding={0}>
        <View style={[styles.topBar, { backgroundColor: COLORS.primary }]} />

        <Flex align="center" gap={12} style={styles.container}>
          <IconBox backgroundColor={COLORS.primary + '20'}>
            <Building2 size={20} color={COLORS.primary} />
          </IconBox>

          <Flex vertical flex={1} gap={2} width={"100%"}>
            <Flex justify="between" align="center">
              <Flex vertical gap={2} flex={1}>
                <Label
                  type="header"
                  value={agency.name}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                />
                <Flex align="center" gap={8}>
                  <Flex align="center" gap={4}>
                    <Users size={14} color={COLORS.textLight} />
                    <Label type="detail" value={`${agency.active_draws} draws`} />
                  </Flex>
                  <Badge
                    content={agency.status}
                    textColor="white"
                    color={getStatusColor(agency.status)}
                  />
                </Flex>
              </Flex>
            </Flex>

            <Flex gap={12} margin={[{ type: "top", value: 8 }]}>
              <Label type="detail" style={styles.detailLabel} value={`Collected: $${agency.total_collected.toLocaleString()}`} />
              <Label type="detail" style={styles.detailLabel} value={`Net: $${agency.net_collected.toLocaleString()}`} />
            </Flex>
            <Flex gap={12} margin={[{ type: "top", value: 4 }]}>
              <Label type="detail" style={styles.detailLabel} value={`Paid: $${agency.premiums_paid.toLocaleString()}`} />
              <Label type="detail" style={styles.detailLabel} value={`Commission: $${agency.commissions.toLocaleString()}`} />
            </Flex>

            <Flex justify="end">
              <ButtonKit
                label="Rules"
                size="small"
                appearance="outline"
                onPress={(e: GestureResponderEvent) => {
                  e?.stopPropagation?.();
                  onRulesPress?.();
                }}
                style={styles.rulesButton}
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
    height: 180,
  },
  container: {
    marginTop: 5,
    paddingLeft: 10,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  topBar: {
    marginLeft: 14,
    height: 4,
    width: '95%',
  },
  rulesButton: {
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 8,
  },
});
