import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trophy } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { ViewTabs } from './components/ViewTabs';
import { TodosScreen } from '../tabs/todos';
import { MisGanadoresScreen } from '../tabs/mis-ganadores';

type ViewType = 'all' | 'mine';

export const WinnersScreen: React.FC = () => {
  const colorScheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const theme = Colors[colorScheme];
  
  const [selectedView, setSelectedView] = useState<ViewType>('all');
  
  const handleViewChange = (view: ViewType) => {
    setSelectedView(view);
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Trophy size={20} color={theme.primary} />
        <Text style={{ color: theme.text, marginLeft: 8, fontSize: 20, fontWeight: 'bold' }}>Resultados</Text>
      </View>
      
      <ViewTabs 
        selectedView={selectedView} 
        onViewChange={handleViewChange} 
        theme={theme}
      />
      
      {selectedView === 'all' ? <TodosScreen /> : <MisGanadoresScreen />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
});