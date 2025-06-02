import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import StyledText from '@/components/typography/StyledText';
import Button from '@/components/ui/Button';
import { useAuth } from '@/shared/context/AuthContext';
import { currentUser, roleDescriptions } from '@/data/mockData';

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { logout } = useAuth();
  
  return (
    <SafeAreaView style={[
      styles.container, 
      { backgroundColor: Colors[colorScheme].background }
    ]}>
      <View style={styles.header}>
        <StyledText variant="heading" weight="bold" size="xl">
          Ajustes
        </StyledText>
      </View>
      
      <View style={styles.section}>
        <StyledText variant="subheading" weight="bold" style={styles.sectionTitle}>
          Información de Usuario
        </StyledText>
        
        <View style={[
          styles.infoCard, 
          { backgroundColor: Colors[colorScheme].backgroundSecondary }
        ]}>
          <StyledText variant="body" weight="bold" style={styles.infoItem}>
            Usuario: {currentUser.username}
          </StyledText>
          
          <StyledText variant="body" style={styles.infoItem}>
            Nombre: {currentUser.name}
          </StyledText>
          
          <View style={styles.roleContainer}>
            <StyledText variant="body" style={styles.infoItem}>
              Rol: <StyledText weight="bold" style={styles.roleText}>{currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}</StyledText>
            </StyledText>
            
            <StyledText variant="caption" style={styles.roleDescription}>
              {roleDescriptions[currentUser.role]}
            </StyledText>
          </View>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Cerrar Sesión"
          variant="destructive"
          size="lg"
          onPress={logout}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.lg,
  },
  section: {
    padding: Layout.spacing.md,
  },
  sectionTitle: {
    marginBottom: Layout.spacing.md,
  },
  infoCard: {
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
  },
  infoItem: {
    marginBottom: Layout.spacing.sm,
  },
  roleContainer: {
    marginTop: Layout.spacing.xs,
  },
  roleText: {
    textTransform: 'capitalize',
  },
  roleDescription: {
    marginTop: Layout.spacing.xs,
    fontStyle: 'italic',
  },
  buttonContainer: {
    padding: Layout.spacing.md,
    marginTop: 'auto',
    marginBottom: Layout.spacing.xl,
  },
});