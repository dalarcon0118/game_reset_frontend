import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Building2, Users, ScrollText, Settings2 } from 'lucide-react-native';
import { useTheme } from '@ui-kitten/components';
import { Flex } from '@/shared/components/flex';
import { Card } from '@/shared/components/card';
import { IconBox } from '@/shared/components/icon-box';
import { Badge } from '@/shared/components/badge';
import { Label } from '@/shared/components/label';
import { ButtonKit } from '@/shared/components/button';
import { es } from '../../../config/language/es';
import { Agency } from '@/shared/repositories/structure/domain/models';

interface AgencyCardProps {
  agency: Agency;
  onPress?: () => void;
  onRulesPress?: () => void;
  onListPress?: () => void;
}

export const AgencyCard: React.FC<AgencyCardProps> = ({ 
  agency, 
  onPress,
  onListPress,
  onRulesPress 
}) => {
  const theme = useTheme();

  // TODO: Backend should provide real status. Defaulting to 'active'.
  const status = 'active';

  const getStatusColor = (s: string) => {
    switch (s.toLowerCase()) {
      case 'active':
        return theme['color-success-500'];
      case 'inactive':
        return theme['color-warning-500'];
      case 'suspended':
        return theme['color-danger-500'];
      default:
        return theme['color-primary-500'];
    }
  };

  const getStatusText = (s: string) => {
     switch (s.toLowerCase()) {
      case 'active':
        return es.banker.common.agencyCard.status.active;
      case 'inactive':
        return es.banker.common.agencyCard.status.inactive;
      case 'suspended':
        return es.banker.common.agencyCard.status.suspended;
      default:
        return s;
    }
  };

  return (
    <Card 
      style={[styles.card, { backgroundColor: theme['background-basic-color-1'] }]} 
      padding={0}
      onPress={onPress}
    >
      <View style={[styles.topBar, { backgroundColor: getStatusColor(status) }]} />

      <Flex padding={16} vertical gap={12}>
        {/* Header Section */}
        <Flex justify="between" align="center">
          <Flex align="center" gap={12} flex={1}>
            <IconBox 
              size={40} 
              backgroundColor={theme['color-primary-500'] + '15'} 
              style={{ borderRadius: 12 }}
            >
              <Building2 size={20} color={theme['color-primary-500']} />
            </IconBox>
            <Flex vertical gap={2} flex={1}>
              <Label
                type="header"
                value={agency.name}
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{ fontSize: 16, color: theme['text-basic-color'], fontWeight: '700' }}
              />
              <Flex align="center" gap={6}>
                <Users size={12} color={theme['text-hint-color']} />
                <Label 
                  type="detail" 
                  value={`${agency.drawIds.length} ${es.banker.common.agencyCard.activeDraws}`} 
                  style={{ fontSize: 12, color: theme['text-hint-color'] }} 
                />
              </Flex>
            </Flex>
          </Flex>
          <Badge
            content={getStatusText(status)}
            textColor="white"
            color={getStatusColor(status)}
            style={{ paddingHorizontal: 8, height: 22, borderRadius: 6 }}
          />
        </Flex>

        {/* Stats Grid */}
        <Flex direction="row" gap={8} style={[styles.statsGrid, { backgroundColor: theme['background-basic-color-2'] }]}>
           <Flex vertical gap={2} flex={1}>
              <Label type="detail" value={es.banker.common.agencyCard.collected} style={[styles.statLabel, { color: theme['text-hint-color'] }]} />
              <Label type="default" value={`${agency.totalCollected.toLocaleString()}`} style={[styles.statValue, { color: theme['text-basic-color'] }]} />
           </Flex>
           <View style={[styles.divider, { backgroundColor: theme['border-basic-color-3'] }]} />
           <Flex vertical gap={2} flex={1}>
              <Label type="detail" value={es.banker.common.agencyCard.net} style={[styles.statLabel, { color: theme['text-hint-color'] }]} />
              <Label type="default" value={`${agency.netCollected.toLocaleString()}`} style={[styles.statValue, { color: theme['text-basic-color'] }]} />
           </Flex>
        </Flex>

        {/* Actions Section */}
        <Flex direction="row" gap={10}>
          <ButtonKit
            style={styles.actionButton}
            size="small"
            appearance="ghost"
            status="primary"
            onPress={onListPress}
            accessoryLeft={(props) => <ScrollText {...props} size={18} />}
            label="Listerias"
            labelStyle={{ fontWeight: '600' }}
          />
          <ButtonKit
            style={styles.actionButton}
            size="small"
            appearance="ghost"
            status="basic"
            onPress={onRulesPress}
            accessoryLeft={(props) => <Settings2 {...props} size={18} />}
            label="Reglamento"
            labelStyle={{ color: theme['text-hint-color'], fontWeight: '600' }}
          />
        </Flex>
      </Flex>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  topBar: {
    height: 3,
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  statsGrid: {
    padding: 12,
    borderRadius: 12,
  },
  divider: {
    width: 1,
    height: '100%',
  },
  statLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
  },
});
