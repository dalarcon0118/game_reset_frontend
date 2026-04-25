import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DRAW_STATUS, DrawStatus, DrawType } from '@/types';

interface DrawHeaderProps {
  draw: DrawType;
  effectiveStatus: DrawStatus;
  closingInfo: { isCritical: boolean; timeLeft: string } | null;
  openingInfo: { timeLeft: string } | null;
  betCount: number;
}

export const DrawHeader: React.FC<DrawHeaderProps> = ({
  draw,
  effectiveStatus,
  closingInfo,
  openingInfo,
  betCount,
}) => {
  const getStatusColor = (status: DrawStatus) => {
    switch (status) {
      case DRAW_STATUS.OPEN: return '#00C48C';
      case DRAW_STATUS.CLOSED: return '#8F9BB3';
      case DRAW_STATUS.SCHEDULED: return '#3366FF';
      case DRAW_STATUS.REWARDED: return '#FFAA00';
      default: return '#8F9BB3';
    }
  };

  const getStatusText = (status: DrawStatus) => {
    switch (status) {
      case DRAW_STATUS.OPEN: return 'Abierto';
      case DRAW_STATUS.CLOSED: return 'Cerrado';
      case DRAW_STATUS.SCHEDULED: return 'Próximo';
      case DRAW_STATUS.REWARDED: return 'Premiado';
      default: return status;
    }
  };

  const formatTime = (datetime: string | null | undefined) => {
    if (!datetime) return '';
    try {
      return new Date(datetime).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } catch {
      return '';
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.title}>{draw.name || draw.id}</Text>
        <View style={styles.timesRow}>
          {draw.betting_start_time && (
            <Text style={styles.timeText}>
              🕐 Abre: {formatTime(draw.betting_start_time)}
            </Text>
          )}
          {draw.betting_end_time && (
            <Text style={styles.timeText}>
              🏁 Cierra: {formatTime(draw.betting_end_time)}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.headerRight}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(effectiveStatus) }]}>
          <Text style={styles.statusText}>{getStatusText(effectiveStatus)}</Text>
        </View>
        {closingInfo && (
          <View style={styles.criticalBadge}>
            <Text style={styles.criticalText}>⏰ {closingInfo.timeLeft}</Text>
          </View>
        )}
        {openingInfo && (
          <View style={styles.scheduledBadge}>
            <Text style={styles.scheduledText}>⏱️ {openingInfo.timeLeft}</Text>
          </View>
        )}
        {betCount > 0 && (
          <Text style={styles.betCount}>{betCount} apuesta{betCount !== 1 ? 's' : ''}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
	title: {
		fontSize: 16,
		fontWeight: '700',
		color: '#1A2138',
		marginBottom: 4,
	},
  timesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timeText: {
    fontSize: 11,
    color: '#8F9BB3',
  },
  datetime: {
    fontSize: 12,
    color: '#8F9BB3',
  },
	statusBadge: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
	},
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
	criticalBadge: {
		backgroundColor: '#FF3D71',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
	},
  criticalText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
	scheduledBadge: {
		backgroundColor: '#3366FF',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
	},
  scheduledText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  betCount: {
    fontSize: 10,
    color: '#8F9BB3',
  },
});