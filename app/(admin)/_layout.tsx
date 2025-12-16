import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { Chrome as Home, ChartBar as BarChart3, List, Settings } from 'lucide-react-native';
import { useAuth } from '@/shared/context/AuthContext'; // Import useAuth
import ColectorTabs from '@/components/colector/tabs';
import WithRole from '@/features/auth/WithRole';
// Assuming UserRole is defined and exported from mockData or your types file
// import { UserRole } from '@/data/mockData';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].primary,
        tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: Colors[colorScheme].border,
          backgroundColor: Colors[colorScheme].background,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerShown: false,
      }}

    >
      
      <Tabs.Screen
        name="index" // This expects a file named index.tsx
        options={{
          title: 'Panel',
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} />
          ),
        }}
      // Set redirect based on role
      />
      
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reportes',
          tabBarIcon: ({ color, size }) => (
            <List color={color} size={size} />
          )
        }}
        
      />
      
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Configuraciones',
          tabBarIcon: ({ color, size }) => (
            <BarChart3 color={color} size={size} />
          ),
        }}
       
      />
  
      
    </Tabs>
  );
}