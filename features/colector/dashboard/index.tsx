import React from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity } from 'react-native';
import { Layout, Text, Button, useTheme } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Calendar, 
  Medal, 
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  Coins, 
  Percent,
  Briefcase,
  ChevronRight
} from 'lucide-react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';

import { COLORS } from '../common/constants';
import { Flex } from '../../../shared/components/Flex';
import { Label } from '../../../shared/components/Label';
import { TopStatCard } from '../common/TopStatCard';
import { GridStatCard } from '../common/GridStatCard';
import { OperationCard } from '../common/OperationCard';

const { width } = Dimensions.get('window');

// Mock Data
const stats = {
  total: 24,
  pending: 3,
  completed: 21,
  netTotal: '$12,500',
  grossTotal: '$15,800',
  commissions: '$948',
  dailyProfit: '$852',
};

const operations = [
  { id: '2024-05-15-001', net: '$680', gross: '$815', commission: '$48.90' },
  { id: '2024-05-15-002', net: '$920', gross: '$1,100', commission: '$66.00' },
  { id: '2024-05-15-003', net: '$1,200', gross: '$1,450', commission: '$87.00' },
];

export default function DashboardScreen() {
  const theme = useTheme();

  return (
    <Flex flex={1}>
      <SafeAreaView style={styles.safeArea}>
        
          {/* Header */}
          <Flex justify="between" align="center" margin="l">
            <Label type="title" value="Collector Dashboard" />
            <TouchableOpacity>
              <Flex align="center" gap={6}  margin="m"padding={"m"} style={styles.dateBadge} >
                <Label type="date" value="May 15, 2024" />
                <Calendar size={16} color={COLORS.textLight} />
              </Flex>
            </TouchableOpacity>
          </Flex>
          <Flex 
            scroll={{ horizontal: true, showsHorizontalScrollIndicator: false }} 
            gap={12} 
            childrenStyle={{ width: width * 0.45, height: 120 }} 
            margin="m"
            height={{ value: 120, max: 120 }}
          >
            {/* Card 1: Net Total */}
            <GridStatCard
              label="Total"
              value={stats.netTotal}
              icon={<TrendingUp size={24} color={COLORS.primary} />}
              barColor={COLORS.primary}
            />
            
            {/* Card 2: Gross Total */}
            

            {/* Card 3: Commissions */}
            <GridStatCard
              label="Commissions"
              value={stats.commissions}
              icon={<Coins size={24} color={COLORS.secondary} />}
              barColor={COLORS.secondary}
              secondaryContent={
                <View style={styles.percentBadge}>
                   <Label type="detail" value=" - 6%" />
                </View>
              }
            />
            <GridStatCard
              label="Perdido"
              value={stats.grossTotal}
              icon={<BarChart3 size={24} color={COLORS.textLight} />}
              barColor={COLORS.textLight}
            />
             {/* Card 4: Daily Profit */}
             <GridStatCard
              label="Ganado"
              value={stats.dailyProfit}
              icon={<Percent size={24} color={COLORS.textLight} />}
              barColor={COLORS.success}
            />
            
          </Flex>
         
          

          {/* Top Stats Row 
          <Flex gap={12} childrenStyle={{ flex: 1 }} style={styles.topStatsRow}>
            <TopStatCard 
              label="Total de Hoy" 
              value={stats.total} 
              icon={<Briefcase size={16} color={COLORS.primary} />} 
            />
            <TopStatCard 
              label="Perdido" 
              value={stats.pending} 
              icon={<TrendingDown size={16} color={COLORS.danger} />} 
            />
            <TopStatCard 
              label="Ganado" 
              value={stats.completed} 
              icon={<Medal size={16} color={COLORS.success} />} 
            />
          </Flex>
          */}
        <Flex 
          vertical 
          flex={1}
          scroll={{ showsVerticalScrollIndicator: false }}
          padding={[{ type: 'horizontal', value: 20 }, { type: 'bottom', value: 40 }]}
        >

          {/* Grid Stats */}
           <Flex gap={12} childrenStyle={{ flex: 1 }}>
            {/* Card 4: Daily Profit */}
           
          </Flex>
          {/* Operations List */}
          <Flex vertical gap={5} >
             <Label type="header">Listas Activas ({stats.completed} completed)</Label>
             {operations.map((op, index) => (
               <OperationCard key={index} operation={op} />
             ))}
          </Flex>

          <Button 
            style={styles.viewAllButton} 
            size='large'
            accessoryRight={<ChevronRight color="white" />}
          >
            View All Operations
          </Button>

        </Flex>
      </SafeAreaView>
    </Flex>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
 
  dateBadge: {
  
    backgroundColor: '#FFFFFF',
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  topStatsRow: {
    marginBottom: 24,
    marginHorizontal: 20,
  },
  gridContainer: {
    marginBottom: 16,
  },
  growthText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 8,
  },
  percentBadge: {
    backgroundColor: '#FFF8E1', // Light yellow
   
    borderRadius: 6,
  },
  percentText: {
    fontSize: 11,
    color: COLORS.warning,
    fontWeight: '700',
  },
  sectionTitle: {
    marginBottom: 16,
  },
  listSection: {
    marginBottom: 24,
  },
  viewAllButton: {
    borderRadius: 30,
    backgroundColor: COLORS.primary,
   borderColor: COLORS.border,
    height: 50,
  },
});
