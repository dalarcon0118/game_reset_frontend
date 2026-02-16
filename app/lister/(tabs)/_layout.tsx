import { Tabs, usePathname } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/colors';
import { Home, LayoutPanelLeft, List, FileText, User } from 'lucide-react-native'; // Import List and FileText
import { useEffect } from 'react';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('LISTER_TABS');

export default function ListerTabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const pathname = usePathname(); // Get the current route path

  // Log the route path whenever it changes
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
        headerShown: false, // Assuming you handle headers within screens or a stack layout
      }}
    >
       <Tabs.Screen
        name="dashboard" // Corresponds to app/lister/(tabs)/dashboard.tsx
        options={{
          title: 'Panel', // Tab title
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} />
          ),
        }}
      />
      
   
     
      <Tabs.Screen
        name="panel" // Corresponds to app/lister/bets.tsx
        options={{
          title: 'Mi perfil', // Updated Tab title
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size} /> // Updated Icon
          ),
        }}
      />

      {/* Add more Tabs.Screen for other lister-specific routes here if needed */}
    </Tabs>
  );
}