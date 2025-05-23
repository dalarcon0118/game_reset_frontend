import React from 'react';
import { StyleSheet } from 'react-native';
import { Layout, Text, Card, Button, useTheme } from '@ui-kitten/components';
import { CalendarClock, Clock3 } from 'lucide-react-native';
import LayoutConstants from '@/constants/Layout'; // Renamed to avoid conflict
import { DrawType } from '@/types';
import { router } from 'expo-router';

interface DrawItemProps {
  draw: DrawType;
  onPress: (id: string) => void;
  index: number;
}

export default function DrawItem({ draw, onPress, index }: DrawItemProps) {
  const theme = useTheme();
  const gotoBetList = (id:string) => {
    router.push({ pathname: '/lister/bets_list/[id]', params: { id } })
  }
  const createBet = (id:string) => {
    router.push({ pathname: '/lister/bets_create/[id]', params: { id } })
  }

  const getStatusBadge = () => {
    const getStatusProps = () => {
      switch (draw.status) {
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
        style={{...styles.badge}}
      >
        {text}
      </Text>
    );
  };

  return (
    <Card
      style={styles.container}
      status='basic'
    >
      <Layout style={{...styles.header}} level='1'>
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
            style={{...styles.infoText}}
          >
            {draw.date}
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
            {draw.time}
          </Text>
          <Button
          appearance='ghost'
          status='warning'
          style={{...styles.actionButton}}
          onPress={() => onPress(draw.id)}
        >
          Reglamento
        </Button>
        </Layout>
      </Layout>
      <Layout style={styles.betsActions} level='1'>
      
      <Button
          appearance='ghost'
          status='primary'
          style={{...styles.actionButton,backgroundColor: theme['color-primary-100'],
            borderColor: theme['color-primary-500'],}}
          onPress={() => gotoBetList(draw.id)}
        >
          Ver lista
        </Button>
        
      {draw.status === 'open' && (
        <Button
          appearance='ghost'
          status='primary'
          style={{...styles.actionButton,backgroundColor: theme['color-primary-100'],
            borderColor: theme['color-primary-500'],}}
          onPress={() => createBet(draw.id)}
        >
          Anotar ahora
        </Button>
      )}
      </Layout>

      
    </Card>
  );
}

const styles = StyleSheet.create({
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
  betsActions:{
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: LayoutConstants.spacing.lg,
      justifyContent:'space-between',
  },
  infoText: {
    marginLeft: LayoutConstants.spacing.xs,
    paddingHorizontal: LayoutConstants.spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionButton: {
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderStyle: 'solid',
    paddingHorizontal: LayoutConstants.spacing.sm,
    paddingVertical: LayoutConstants.spacing.xs,
    borderRadius: LayoutConstants.borderRadius.sm,
  },
});