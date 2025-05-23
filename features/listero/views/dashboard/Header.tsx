import { useState } from 'react';
import { StyleSheet, Modal, Pressable } from 'react-native';
import { Layout, Text, Icon, Button, useTheme } from '@ui-kitten/components';
import { CircleUser as UserCircle2, LogOut } from 'lucide-react-native';
import LayoutConstants from '@/constants/Layout'; // Renamed to avoid conflict
import { useAuth } from '@/shared/context/AuthContext';

interface HeaderProps {}

export default function Header({}: HeaderProps) {
  const theme = useTheme();
  const { logout, user } = useAuth();
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  const handleLogout = () => {
    toggleMenu();
    logout();
  };

  return (
    <Layout style={styles.container} level='1'>
      <Layout>
        <Text category='c1' appearance='hint'>
          Bienvenido
        </Text>
        <Text category='h5' style={styles.userName}>
          {user?.name || 'Usuario'}
        </Text>
      </Layout>

      <Layout>
        <Button
          style={styles.profileButton}
          appearance='ghost'
          onPress={toggleMenu}
          accessoryLeft={(props) => (
            <UserCircle2
              size={32}
              color={theme['color-primary-500']}
            />
          )}
        />

        <Modal
          transparent={true}
          visible={isMenuVisible}
          onRequestClose={toggleMenu}
          animationType="fade"
        >
          <Pressable style={styles.modalOverlay} onPress={toggleMenu}>
            <Layout style={styles.menuContainer} level='2'>
              <Pressable onPress={(e) => e.stopPropagation()}>
                <Button
                  appearance='ghost'
                  status='danger'
                  style={styles.menuItem}
                  accessoryLeft={(props) => (
                    <LogOut size={18} color={theme['color-danger-500']} style={styles.menuIcon} />
                  )}
                  onPress={handleLogout}
                >
                  Cerrar Sesión
                </Button>
              </Pressable>
            </Layout>
          </Pressable>
        </Modal>
      </Layout>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: LayoutConstants.spacing.md,
    paddingVertical: LayoutConstants.spacing.lg,
    position: 'relative',
    marginTop: LayoutConstants.spacing.lg,
  },
  userName: {
    fontWeight: 'bold',
  },
  profileButton: {
    borderRadius: 20,
    minWidth: 40,
    minHeight: 40,
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'flex-end',
    paddingTop: LayoutConstants.spacing.lg * 2 + 40,
    paddingRight: LayoutConstants.spacing.md,
  },
  menuContainer: {
    borderRadius: LayoutConstants.spacing.sm,
    padding: LayoutConstants.spacing.sm,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 150,
  },
  menuItem: {
    justifyContent: 'flex-start',
    paddingVertical: LayoutConstants.spacing.sm,
    paddingHorizontal: LayoutConstants.spacing.xs,
  },
  menuIcon: {
    marginRight: LayoutConstants.spacing.sm,
  },
});