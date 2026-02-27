import { Stack } from "expo-router";
import { View } from "react-native";

const screenOptions = {
  headerShown: true,
  headerBackVisible: true,
  freezeOnBlur: true,
};

export default function AuthenticatedLayout() {
  return (
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          
          {/* Rutas de Lotería */}
          <Stack.Screen 
            name="bets/loteria/anotate" 
            options={{ ...screenOptions, headerTitle: 'Anotar' }} 
          />
          <Stack.Screen 
            name="bets/loteria/list" 
            options={{ ...screenOptions, headerTitle: 'Lista', headerBackTitle: 'Atrás' }} 
          />
          
          {/* Rutas de Bolita */}
          <Stack.Screen 
            name="bets/bolita/anotate" 
            options={{ ...screenOptions, headerTitle: 'Anotar' }} 
          />
          <Stack.Screen 
            name="bets/bolita/list" 
            options={{ ...screenOptions, headerTitle: 'Lista', headerBackTitle: 'Atrás' }} 
          />
          
          {/* Rutas de Reglamento */}
          <Stack.Screen 
            name="bets/rules/index" 
            options={{ ...screenOptions, headerTitle: 'Reglamento', headerBackTitle: 'Atrás' }} 
          />
        </Stack>
      </View>
  );
}
