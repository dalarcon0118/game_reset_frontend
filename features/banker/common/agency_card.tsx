import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Building2, Users } from 'lucide-react-native';
import { useTheme } from '@ui-kitten/components';
import { Flex } from '@/shared/components/flex';  
import { Card } from '@/shared/components/card';
import { IconBox } from '@/shared/components/icon-box';
import { Badge } from '@/shared/components/badge';
import { Label } from '@/shared/components/label';
import { es } from '../../../config/language/es';
import { Agency } from '@/shared/repositories/structure/domain/models';

interface AgencyCardProps {
  agency: Agency;
  onPress?: () => void;
  onRulesPress?: () => void;
  onListPress?: () => void;
}

export const AgencyCard: React.FC<AgencyCardProps> = ({ agency, onPress }) => {
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
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <Card 
        style={[styles.card, { backgroundColor: theme['background-basic-color-1'] }]} 
        padding={0}
      >
        <View style={[styles.topBar, { backgroundColor: getStatusColor(status) }]} />

        <Flex padding={16} vertical gap={16}>
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
                  style={{ fontSize: 16, color: theme['text-basic-color'] }}
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
              style={{ paddingHorizontal: 8, height: 24 }}
            />
          </Flex>

          {/* Stats Grid */}
          <View style={[styles.statsGrid, { backgroundColor: theme['background-basic-color-2'] }]}>
             <Flex vertical gap={4} style={styles.statItem}>
                <Label type="detail" value={es.banker.common.agencyCard.collected} style={[styles.statLabel, { color: theme['text-hint-color'] }]} />
                <Label type="default" value={`$${agency.totalCollected.toLocaleString()}`} style={[styles.statValue, { color: theme['text-basic-color'] }]} />
             </Flex>
             <Flex vertical gap={4} style={styles.statItem}>
                <Label type="detail" value={es.banker.common.agencyCard.net} style={[styles.statLabel, { color: theme['text-hint-color'] }]} />
                <Label type="default" value={`$${agency.netCollected.toLocaleString()}`} style={[styles.statValue, { color: theme['text-basic-color'] }]} />
             </Flex>
          </View>
        </Flex>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  topBar: {
    height: 4,
    width: '100%',
    position: 'absolute',
    top: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
  },
  statItem: {
    width: '45%',
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
});
