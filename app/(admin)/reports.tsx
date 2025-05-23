import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router'; // Import useRouter
import Button from '@/components/ui/Button'; // Import your custom Button
import Layout from '@/constants/Layout'; // Import Layout for spacing

export default function BetsScreen() {
  const router = useRouter(); // Initialize router


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>Pantalla de Apuestas</Text>
       
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.md, // Add padding
  },
  text: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: Layout.spacing.lg, // Add margin below text
  },
  button: {
    // Add specific button styles if needed, or rely on variant/defaults
    minWidth: 200, // Example style
  },
});