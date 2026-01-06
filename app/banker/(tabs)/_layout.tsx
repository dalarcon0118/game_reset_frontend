import { Tabs } from "expo-router";
import { useTheme } from '@ui-kitten/components';
import { LayoutDashboard, FileText, Settings, Shield } from 'lucide-react-native';
import { routes } from '@/config/routes';

export default function BankerLayout() {
  const theme = useTheme();

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: theme['color-primary-500'],
      tabBarInactiveTintColor: theme['text-hint-color'],
      tabBarStyle: {
        borderTopColor: theme['color-basic-400'],
        backgroundColor: theme['background-basic-color-1'],
      }
    }}>
      <Tabs.Screen
        name="index"
        options={{
          ...routes.banker.dashboard.options,
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          ...routes.banker.reports.options,
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="rules"
        options={{
          title: 'Rules',
          tabBarIcon: ({ color, size }) => <Shield color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
