import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Trophy, Users } from 'lucide-react-native';
import { ViewType } from '../../core/types';

interface ViewTabsProps {
  selectedView: ViewType;
  onViewChange: (view: ViewType) => void;
  theme: any;
}

export const ViewTabs: React.FC<ViewTabsProps> = ({ selectedView, onViewChange, theme }) => {
  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <TouchableOpacity
        style={[
          styles.tab,
          selectedView === 'all' && [styles.activeTab, { borderBottomColor: theme.primary }]
        ]}
        onPress={() => onViewChange('all')}
      >
        <Trophy size={16} color={selectedView === 'all' ? theme.primary : theme.textSecondary} />
        <Text 
          category="c1" 
          style={{ 
            color: selectedView === 'all' ? theme.primary : theme.textSecondary,
            marginLeft: 4
          }}
        >
          Todos
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.tab,
          selectedView === 'mine' && [styles.activeTab, { borderBottomColor: theme.primary }]
        ]}
        onPress={() => onViewChange('mine')}
      >
        <Users size={16} color={selectedView === 'mine' ? theme.primary : theme.textSecondary} />
        <Text 
          category="c1" 
          style={{ 
            color: selectedView === 'mine' ? theme.primary : theme.textSecondary,
            marginLeft: 4
          }}
        >
          Mis Ganadores
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
});