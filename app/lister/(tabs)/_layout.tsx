import { Tabs, usePathname } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/colors';
import { Home, Trophy, User, Gift } from 'lucide-react-native';
import { useEffect } from 'react';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('LISTER_TABS');

export default function ListerTabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const pathname = usePathname();

  useEffect(() => {
    log.debug('Current Route inside lister', { pathname });
  }, [pathname]);

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
        name="dashboard"
        options={{
          title: 'Panel',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Home color={color} size={size} />
          ),
        }}
      />
      
       <Tabs.Screen
        name="winners"
        options={{
          title: 'Resultados',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Trophy color={color} size={size} />
          ),
        }}
      />
       
       <Tabs.Screen
        name="panel"
        options={{
          title: 'Mi perfil',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <User color={color} size={size} />
          ),
        }}
      />
       
       <Tabs.Screen
        name="reward"
        options={{
          title: 'Premios',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Gift color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}