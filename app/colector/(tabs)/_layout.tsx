import { Tabs } from "expo-router";
import { useTheme } from '@ui-kitten/components';
import { LayoutDashboard, Briefcase, FileText, Settings } from 'lucide-react-native';
import { routes } from '@/config/routes';

export default function ColectorLayout() {
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
        name={routes.colector.dashboard.screen}
        options={{
          ...routes.colector.dashboard.options,
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name={routes.colector.reports.screen}
        options={{
          ...routes.colector.reports.options,
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name={routes.colector.settings.screen}
        options={{
          ...routes.colector.settings.options,
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
