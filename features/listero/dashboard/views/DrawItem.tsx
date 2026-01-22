import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Label, Card, Flex, ButtonKit, Badge } from '../../../../shared/components';
import { CalendarClock, Clock3, ChevronRight, AlarmClock } from 'lucide-react-native';
import { DrawType } from '@/types';
import SummaryCard from './SummaryCard';

interface DrawItemProps {
  draw: DrawType;
  onRulePress: (id: string) => void;
  onRewardsPress: (id: string, title: string) => void;
  onBetsListPress: (id: string, title: string) => void;
  onCreateBetPress: (id: string, title: string) => void;
  index: number;
}

export default function DrawItem({
   draw,
   onRulePress,
   onRewardsPress,
   onBetsListPress,
   onCreateBetPress,
   index }: DrawItemProps) {
  
  const handleRewardsPress = () => {
    onRewardsPress(draw.id.toString(), draw.source || '');
  }

  const handleBetsListPress = () => {
    onBetsListPress(draw.id.toString(), draw.source || '');
  }

  const handleCreateBetPress = () => {
    onCreateBetPress(draw.id.toString(), draw.source || '');
  }

  const getDrawStatus = () => {
    // Si el backend nos dice explícitamente que las apuestas están abiertas, lo respetamos.
    // Esto es vital para sorteos con ventanas de apuestas largas (ej: Lotería Semanal)
    if (draw.is_betting_open === true) return 'open';
    
    if (!draw.betting_end_time) return draw.status;
    const now = new Date();
    const endTime = new Date(draw.betting_end_time);
    if (now >= endTime) return 'closed';
    return draw.status;
  };

  const effectiveStatus = getDrawStatus();

  const getClosingTimeInfo = () => {
    if (!draw.betting_end_time || effectiveStatus !== 'open') return null;
    
    const now = new Date();
    const endTime = new Date(draw.betting_end_time);
    const diffMs = endTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

    if (diffMs > 0 && diffMs < 5 * 60 * 1000) {
      return {
        isCritical: true,
        timeLeft: `${diffMins}:${diffSecs.toString().padStart(2, '0')}`
      };
    }
    return null;
  };

  const closingInfo = getClosingTimeInfo();

  const getStatusBadge = () => {
    switch (effectiveStatus) {
      case 'open':
        return (
          <Badge 
            color={closingInfo?.isCritical ? "#FF3D71" : "#00D68F"} 
            textColor="#FFFFFF"
            content={closingInfo?.isCritical ? `Cierra en ${closingInfo.timeLeft}` : "Abierto"}
          />
        );
      case 'closed':
        return (
          <Badge 
            color="#FF3D71" 
            textColor="#FFFFFF"
            content="Cerrado"
          />
        );
      default:
        return (
          <Badge 
            color="#8F9BB3" 
            textColor="#FFFFFF"
            content={effectiveStatus}
          />
        );
    }
  };

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return 'N/A';
    }
  };

  return (
    <Card style={[styles.container, closingInfo?.isCritical && styles.criticalContainer]}>
      {/* Header with Title and Status */}
      <Flex justify="between" align="center" style={styles.header}>
        <View>
          <Label style={styles.drawTitle}>{draw.source}</Label>
          <Flex align="center" gap={4}>
            <CalendarClock size={12} color="#8F9BB3" />
            <Label type="detail" style={styles.dateText}>{draw.date}</Label>
            <Clock3 size={12} color="#8F9BB3" style={{ marginLeft: 4 }} />
            <Label type="detail" style={styles.dateText}>
              {formatTime(draw.betting_start_time)} - {formatTime(draw.betting_end_time)}
            </Label>
          </Flex>
        </View>
        <Flex align="center" gap={8}>
         
          {closingInfo?.isCritical && (
            <AlarmClock size={20} color="#FF3D71" />
          )}
        </Flex>
      </Flex>

      {/* Financial Row - Compact */}
      <View style={styles.financialRow}>
        <SummaryCard
          title="Ventas"
          amount={draw.totalCollected ?? 0}
          type="collected"
        />
        <View style={styles.verticalDivider} />
        <SummaryCard
          title="Premios"
          amount={draw.premiumsPaid ?? 0}
          type="paid"
        />
        <View style={styles.verticalDivider} />
        
      </View>

      {/* Action Buttons */}
      <Flex gap={8} style={styles.actionsRow}>
        <ButtonKit
          appearance="ghost"
          status="warning"
          size="small"
          style={[styles.actionButton, styles.reglamentoButton]}
          onPress={() => onRulePress(draw.id)}
          label="Reglas"
        />
        
        <ButtonKit
          appearance="outline"
          status="primary"
          size="small"
          style={styles.actionButton}
          onPress={handleBetsListPress}
          label="Ver Lista"
        />

        {effectiveStatus === "closed" ? (
          <ButtonKit
            appearance="filled"
            status="primary"
            size="small"
            style={styles.actionButton}
            onPress={handleRewardsPress}
            label="Premios"
          />
        ) : (
          <ButtonKit
            appearance="filled"
            status="primary"
            size="small"
            style={styles.actionButton}
            onPress={handleCreateBetPress}
            label="Anotar"
          />
        )}
      </Flex>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  criticalContainer: {
    backgroundColor: '#FFF5F8',
  },
  header: {
    marginBottom: 12,
  },
  drawTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E3A59',
  },
  dateText: {
    fontSize: 11,
    color: '#8F9BB3',
  },
  financialRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FB',
    borderRadius: 8,
    paddingVertical: 8,
    marginBottom: 12,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#E4E9F2',
    height: '60%',
    alignSelf: 'center',
  },
  actionsRow: {
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    height: 36,
    borderRadius: 8,
  },
  reglamentoButton: {
    flex: 0.7,
  }
});