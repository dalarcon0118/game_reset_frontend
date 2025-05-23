import WithRole from "@/features/auth/WithRole";
import { useAuth } from "@/shared/context/AuthContext";
import { Redirect } from "expo-router";
/*
export default function IndexView() {
  const { user } = useAuth(); // Get user info from AuthContext

  // Determine redirect behavior based on role
  // IMPORTANT: Adjust 'user?.role' based on how your AuthContext actually provides the role.
  // This example assumes useAuth() returns { user: { role: UserRole } }
  const isColector = user?.role === 'colector';
  const isLister = user?.role === 'lister';
  const isAdmin = user?.role === 'admin';
  // Redirect logic
  if (isColector) {
    return <Redirect href="/colector" />;
  }
  if (isLister) {
    return <Redirect href="/lister" />;
  }
  if (isAdmin) {
    return <Redirect href="/admin" />;
  }
  return (
    <>
   
      {<Redirect href="/login" />}
    
    </>
  ) ;
}*/
import { StyleSheet, View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut } from 'lucide-react-native'; // Import an icon for logout
import Colors from '@/constants/Colors'; // Import Colors
import Layout from '@/constants/Layout'; // Import Layout
import StyledText from '@/components/typography/StyledText'; // Assuming you have this

export default function AdminIndexView() { // Renamed component for clarity
  const { user, logout } = useAuth(); // Get user and logout function
  const colorScheme = useColorScheme() ?? 'light';
  const iconColor = Colors[colorScheme].text; // Define icon color based on theme

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { borderBottomColor: Colors[colorScheme].border }]}>
        <StyledText variant="body">
          Bienvenido, {user?.username || 'Admin'}
        </StyledText>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <LogOut size={24} color={iconColor} />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        <StyledText variant="h2">Pantalla de inicio de admin</StyledText>
        {/* Add other admin dashboard content here */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
    // backgroundColor: Colors[colorScheme].card, // Optional: Add background to top bar
  },
  logoutButton: {
    padding: Layout.spacing.xs, // Add padding for easier tapping
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.lg,
  },
  // Removed text style as StyledText is used
});