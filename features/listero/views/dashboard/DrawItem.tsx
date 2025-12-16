import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Layout, Text, Card, Button, useTheme } from '@ui-kitten/components';
import { CalendarClock, Clock3 } from 'lucide-react-native';
import LayoutConstants from '@/constants/Layout'; // Renamed to avoid conflict
import { DrawType } from '@/types';
import { router } from 'expo-router';
import SummaryCard from './SummaryCard';

interface DrawItemProps {
  draw: DrawType;
  onPress: (id: string) => void;
  index: number;
}

export default function DrawItem({
   draw,
   onPress,
   index }: DrawItemProps) {
  const theme = useTheme();
  const [effectiveStatus, setEffectiveStatus] = useState(draw.status);
  
  const OnRewardsPress = (id: string) => {
    router.push({ pathname: '/lister/rewards/[id]', params: { id,title:draw.source } })
  }

  const gotoBetList = (id: string) => {
    router.push({ pathname: '/lister/bets_list/[id]', params: { id, title:draw.source } })
  }

  const createBet = (id: string) => {
    router.push({ pathname: '/lister/bets_create/[id]', params: { id ,title:draw.source} })
  }

  // Verificar si el sorteo debe cerrarse automáticamente (10 min antes del betting_end_time)
  useEffect(() => {
    const checkDrawStatus = () => {
      if (!draw.betting_end_time) return;

      const now = new Date();
      const bettingEndTime = new Date(draw.betting_end_time);
      const tenMinutesBeforeEnd = new Date(bettingEndTime.getTime() - 10 * 60 * 1000);

      // Si faltan 10 minutos o menos para el cierre, marcar como cerrado
      if (now >= tenMinutesBeforeEnd && (draw.status === 'open' || draw.status === 'scheduled')) {
        setEffectiveStatus('closed');
      } else {
        setEffectiveStatus(draw.status);
      }
    };

    // Verificar inmediatamente
    checkDrawStatus();

    // Verificar cada minuto
    const interval = setInterval(checkDrawStatus, 60000);

    return () => clearInterval(interval);
  }, [draw.betting_end_time, draw.status])

  const getStatusBadge = () => {
    const getStatusProps = () => {
      switch (effectiveStatus) {
        case 'open':
          return { status: 'success', text: 'Abierto para Anotar' };
        case 'pending':
          return { status: 'warning', text: 'Pendiente' };
        case 'closed':
          return { status: 'danger', text: 'Cerrado' };
        default:
          return { status: 'basic', text: 'Unknown' };
      }
    };

    const { status, text } = getStatusProps();
    return (
      <Text
        category='c1'
        status={status}
        style={{ ...styles.badge }}
      >
        {text}
      </Text>
    );
  };

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  return (
    <Card
      style={styles.container}
      status='basic'
    >
      <Layout style={{ ...styles.header }} level='1'>
        <Text category='h6' >{draw.source}</Text>
        {getStatusBadge()}

      </Layout>

      <Layout style={styles.infoContainer} level='1'>
        <Layout style={styles.infoItem} level='1'>
          <CalendarClock
            size={18}
            color={theme['text-hint-color']}
          />
          <Text
            category='p2'
            appearance='hint'
            style={{ ...styles.infoText }}
          >
            {draw.date ?? 'N/A'}
          </Text>
        </Layout>

        <Layout style={styles.infoItem} level='1'>
          <Clock3
            size={18}
            color={theme['text-hint-color']}
          />
          <Text
            category='p2'
            appearance='hint'
            style={styles.infoText}
          >
            {formatTime(draw.betting_start_time)} - {formatTime(draw.betting_end_time)}
          </Text>
        </Layout>
      </Layout>
      <Layout style={styles.betsActions} level='1'>

        <Button
            appearance='ghost'
            status='warning'
            size='small'
            style={styles.actionButton}
            onPress={() => onPress(draw.id)}
          >
            Reglamento
        </Button>

        <Button
          appearance='ghost'
          status='primary'
          size='small'
          style={{
            ...styles.actionButton, backgroundColor: theme['color-primary-100'],
            borderColor: theme['color-primary-500'],
          }}
          onPress={() => gotoBetList(draw.id)}
        >
          Ver lista
        </Button>

        {effectiveStatus === "closed" && <Button
          appearance='ghost'
          status='primary'
          size='small'
          style={{
            ...styles.actionButton, backgroundColor: theme['color-primary-100'],
            borderColor: theme['color-primary-500'],
          }}
          onPress={() => OnRewardsPress(draw.id)}
        >
          Premios
        </Button>}

        {effectiveStatus === 'open' && (
          <Button
            appearance='ghost'
            status='primary'
            size='small'
            style={{
              ...styles.actionButton, backgroundColor: theme['color-primary-100'],
              borderColor: theme['color-primary-500'],
            }}
            onPress={() => createBet(draw.id)}
          >
            Anotar ahora
          </Button>
        )}
      </Layout>
      <Layout style={styles.statsContainer}>
        <SummaryCard
          title="Recaudado"
          amount={draw.totalCollected ?? 0}
          type="collected"
        />
        <SummaryCard
          title="Pagado"
          amount={draw.premiumsPaid ?? 0}
          type="paid"
        />
        <SummaryCard
          title="Mis ganos"
          amount={draw.netResult ?? 0}
          type="net"
        />
      </Layout>


    </Card>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: LayoutConstants.spacing.md,
    gap: LayoutConstants.spacing.sm,
  },
  container: {
    marginBottom: LayoutConstants.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: LayoutConstants.spacing.sm,
  },
  badge: {
    paddingHorizontal: LayoutConstants.spacing.sm,
    paddingVertical: LayoutConstants.spacing.xs,
    borderRadius: LayoutConstants.borderRadius.sm,
    fontWeight: 'bold', // Added solid text style
  },
  infoContainer: {
    flexDirection: 'row',
    marginBottom: LayoutConstants.spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: LayoutConstants.spacing.lg,
  },
  betsActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: LayoutConstants.spacing.sm,
    marginTop: LayoutConstants.spacing.sm,
    flexWrap: 'wrap',
  },
  infoText: {
    marginLeft: LayoutConstants.spacing.xs,
    paddingHorizontal: LayoutConstants.spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionButton: {
    borderWidth: 1,
    borderStyle: 'solid',
    paddingHorizontal: LayoutConstants.spacing.sm,
    paddingVertical: LayoutConstants.spacing.xs,
    borderRadius: LayoutConstants.borderRadius.sm,
  },
});