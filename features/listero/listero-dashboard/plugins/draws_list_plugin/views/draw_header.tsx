import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CalendarClock, Clock3 } from 'lucide-react-native';
import { Flex, Label } from '@/shared/components';
import { Draw } from '../core/types';
import DrawStatusBadge from './draw_status_badge';
import { DrawStatus } from '@/types';

interface DrawHeaderProps {
  draw: Draw;
  effectiveStatus: DrawStatus;
  closingInfo: {
    isCritical: boolean;
    timeLeft: string;
  } | null;
  betCount: number;
}

const formatTime = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return 'N/A';
  }
};

const DrawHeader: React.FC<DrawHeaderProps> = ({
  draw,
  effectiveStatus,
  closingInfo,
  betCount,
}) => {
  return (
    <Flex justify="between" align="start" style={styles.header}>
      <View style={styles.titleContainer}>
        <Flex align="center" gap={8}>
          <Label style={styles.drawTitle}>{draw.source}</Label>
        </Flex>
        <Flex align="center" gap={4}>
          <CalendarClock size={12} color="#8F9BB3" />
          <Label type="detail" style={styles.dateText}>{draw.date}</Label>
          <Clock3 size={12} color="#8F9BB3" style={{ marginLeft: 4 }} />
          <Label type="detail" style={styles.dateText}>
            {formatTime(draw.betting_start_time)} - {formatTime(draw.betting_end_time)}
          </Label>
        </Flex>
      </View>
      <Flex align="center" justify="end" gap={8} style={styles.statusWrapper}>
        <DrawStatusBadge
          status={effectiveStatus}
          closingInfo={closingInfo}
          betCount={betCount}
        />
      </Flex>
    </Flex>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 12,
    minHeight: 40,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  statusWrapper: {
    minWidth: 80,
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
});

export default DrawHeader;
