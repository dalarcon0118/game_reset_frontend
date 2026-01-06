import React from 'react';
import { View, StyleSheet, TouchableOpacity, GestureResponderEvent } from 'react-native';
import { Building2, Users } from 'lucide-react-native';
import { COLORS } from '../../../shared/components/constants';
import { Flex } from '../../../shared/components/flex';
import { Card } from '../../../shared/components/card';
import { IconBox } from '../../../shared/components/icon-box';
import { Badge } from '../../../shared/components/badge';
import { Label } from '../../../shared/components/label';
import { ButtonKit } from '../../../shared/components/button';
import { es } from '../../language/es';

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
  onListPress?: () => void;
}

export const AgencyCard: React.FC<AgencyCardProps> = ({ agency, onPress, onRulesPress, onListPress }) => {
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

  const getStatusText = (status: string) => {
     switch (status.toLowerCase()) {
      case 'active':
        return es.banker.common.agencyCard.status.active;
      case 'inactive':
        return es.banker.common.agencyCard.status.inactive;
      case 'suspended':
        return es.banker.common.agencyCard.status.suspended;
      default:
        return status;
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <Card style={styles.card} padding={0}>
        <View style={[styles.topBar, { backgroundColor: getStatusColor(agency.status) }]} />

        <Flex padding={16} vertical gap={16}>
          {/* Header Section */}
          <Flex justify="between" align="center">
            <Flex align="center" gap={12} flex={1}>
              <IconBox size={40} backgroundColor={COLORS.primary + '15'} style={{ borderRadius: 12 }}>
                <Building2 size={20} color={COLORS.primary} />
              </IconBox>
              <Flex vertical gap={2} flex={1}>
                <Label
                  type="header"
                  value={agency.name}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{ fontSize: 16 }}
                />
                <Flex align="center" gap={6}>
                  <Users size={12} color={COLORS.textLight} />
                  <Label type="detail" value={`${agency.active_draws} ${es.banker.common.agencyCard.activeDraws}`} style={{ fontSize: 12 }} />
                </Flex>
              </Flex>
            </Flex>
            <Badge
              content={getStatusText(agency.status)}
              textColor="white"
              color={getStatusColor(agency.status)}
              style={{ paddingHorizontal: 8, height: 24 }}
            />
          </Flex>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
             <Flex vertical gap={4} style={styles.statItem}>
                <Label type="detail" value={es.banker.common.agencyCard.collected} style={styles.statLabel} />
                <Label type="default" value={`$${agency.total_collected.toLocaleString()}`} style={styles.statValue} />
             </Flex>
             <Flex vertical gap={4} style={styles.statItem}>
                <Label type="detail" value={es.banker.common.agencyCard.net} style={styles.statLabel} />
                <Label type="default" value={`$${agency.net_collected.toLocaleString()}`} style={styles.statValue} />
             </Flex>
             <Flex vertical gap={4} style={styles.statItem}>
                <Label type="detail" value={es.banker.common.agencyCard.paid} style={styles.statLabel} />
                <Label type="default" value={`$${agency.premiums_paid.toLocaleString()}`} style={styles.statValue} />
             </Flex>
             <Flex vertical gap={4} style={styles.statItem}>
                <Label type="detail" value={es.banker.common.agencyCard.commission} style={styles.statLabel} />
                <Label type="default" value={`$${agency.commissions.toLocaleString()}`} style={styles.statValue} />
             </Flex>
          </View>

          {/* Actions */}
          <Flex justify="end" gap={8} margin={[{ type: 'top', value: 8 }]}>
            <ButtonKit
              label={es.banker.common.agencyCard.viewLists}
              size="small"
              appearance="ghost"
              status="primary"
              onPress={(e: GestureResponderEvent) => {
                e?.stopPropagation?.();
                onListPress?.();
              }}
            />
            <ButtonKit
              label={es.banker.common.agencyCard.rulesConfiguration}
              size="small"
              appearance="ghost"
              status="primary"
              onPress={(e: GestureResponderEvent) => {
                e?.stopPropagation?.();
                onRulesPress?.();
              }}
            />
          </Flex>
        </Flex>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  topBar: {
    height: 4,
    width: '100%',
    position: 'absolute',
    top: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    padding: 16,
    backgroundColor: COLORS.background + '50',
    borderRadius: 12,
  },
  statItem: {
    width: '45%',
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.6,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  }
});
