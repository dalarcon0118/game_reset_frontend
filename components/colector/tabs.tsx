import { useAuth } from '@/shared/context/AuthContext';
import { Tabs } from 'expo-router';
import { BarChart3, Home, List } from 'lucide-react-native';

export  default function ColectorTabs() {
    const { user } = useAuth(); // Get user info from AuthContext
    const isColector = user?.role === 'colector';

  return (
    <>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Panel',
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} />
          ),
        }}
        redirect={!isColector} // Set redirect based on role
      />
      <Tabs.Screen
        name="bets"
        options={{
          title: 'Mi lista',
          tabBarIcon: ({ color, size }) => (
            <List color={color} size={size} />
          ),
        }}
        redirect={!isColector}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Anotar',
          tabBarIcon: ({ color, size }) => (
            <BarChart3 color={color} size={size} />
          ),
        }}
        redirect={!isColector}
      />
    </>
  );
}