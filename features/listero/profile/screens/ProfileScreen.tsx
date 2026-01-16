import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text, Card, Avatar, Button, Divider, Spinner, Layout, TopNavigation, TopNavigationAction } from '@ui-kitten/components';
import { Key, LogOut, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { useProfileStore, selectProfileModel, selectDispatch, selectInit } from '../store';
import { ProfileMsgType } from '../profile.types';
import { RemoteData } from '@/shared/core/remote.data';
import { useAuth } from '../../../auth/hooks/useAuth';
import { IncidentList } from '../components/IncidentList';
import LayoutConstants from '@/constants/Layout';

export const ProfileScreen: React.FC = () => {
    const model = useProfileStore(selectProfileModel);
    const dispatch = useProfileStore(selectDispatch);
    const init = useProfileStore(selectInit);
    const { logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        init();
    }, [init]);

    const { user, isLoggingOut } = model;

    useEffect(() => {
        if (isLoggingOut) {
            logout();
        }
    }, [isLoggingOut, logout]);

    const handleLogout = () => {
        dispatch({ type: ProfileMsgType.LOGOUT_REQUESTED });
    };

    const handleChangePassword = () => {
        dispatch({ type: ProfileMsgType.CHANGE_PASSWORD_REQUESTED });
    };

    const renderBackAction = () => (
        <TopNavigationAction
            icon={(props: any) => (
                <View style={props?.style as any}>
                    <ArrowLeft size={24} color="#2E3A59" />
                </View>
            )}
            onPress={() => router.back()}
        />
    );

    const renderHeader = () => (
        <TopNavigation
            title={(props) => <Text {...props} style={[props?.style, styles.headerTitle]}>Mi Perfil</Text>}
            alignment='center'
            accessoryLeft={renderBackAction}
            style={styles.header}
        />
    );

    if (RemoteData.isLoading(user)) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                {renderHeader()}
                <View style={styles.loadingContainer}>
                    <Spinner size="large" />
                    <Text style={styles.loadingText}>Cargando perfil...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (RemoteData.isFailure(user)) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                {renderHeader()}
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Error al cargar el perfil</Text>
                    <Button
                        onPress={() => dispatch({ type: ProfileMsgType.INIT })}
                        style={styles.retryButton}
                    >
                        Reintentar
                    </Button>
                </View>
            </SafeAreaView>
        );
    }

    const { userData } = model;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {renderHeader()}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Header */}
                <Card style={styles.profileCard}>
                    <View style={styles.profileHeader}>
                        <Avatar
                            size="large"
                            source={{ uri: 'https://via.placeholder.com/80x80/667eea/ffffff?text=U' }}
                            style={styles.avatar}
                        />
                        <View style={styles.profileInfo}>
                            <Text category="h5" style={styles.userName}>
                                {userData.firstName}
                            </Text>
                            {userData.alias && (
                                <Text category="s1" style={styles.userAlias}>
                                    "{userData.alias}"
                                </Text>
                            )}
                            <Text category="p2" style={styles.userZone}>
                                {userData.zone}
                            </Text>
                            <View style={styles.statusContainer}>
                                <View
                                    style={[
                                        styles.statusIndicator,
                                        userData.status === 'ACTIVE' && styles.statusActive,
                                        userData.status === 'INACTIVE' && styles.statusInactive,
                                    ]}
                                />
                                <Text
                                    category="c2"
                                    style={[
                                        styles.statusText,
                                        userData.status === 'ACTIVE' && styles.statusTextActive,
                                        userData.status === 'INACTIVE' && styles.statusTextInactive,
                                    ]}
                                >
                                    {userData.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </Card>

                {/* Menu Options */}
                <Card style={styles.menuCard}>
                    <Text category="h6" style={styles.menuTitle}>Opciones de Cuenta</Text>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={handleChangePassword}
                    >
                        <View style={styles.menuItemLeft}>
                            <View style={[styles.menuIconContainer, { backgroundColor: '#E8F4FD' }]}>
                                <Key size={20} color="#007AFF" />
                            </View>
                            <View style={styles.menuItemContent}>
                                <Text category="s1" style={styles.menuItemTitle}>
                                    Cambiar Contraseña
                                </Text>
                                <Text category="c2" style={styles.menuItemSubtitle}>
                                    Actualiza tu contraseña de acceso
                                </Text>
                            </View>
                        </View>
                        <ChevronRight size={20} color="#8F9BB3" />
                    </TouchableOpacity>

                    <Divider style={styles.divider} />

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={handleLogout}
                    >
                        <View style={styles.menuItemLeft}>
                            <View style={[styles.menuIconContainer, { backgroundColor: '#FFEEEE' }]}>
                                <LogOut size={20} color="#FF3D71" />
                            </View>
                            <View style={styles.menuItemContent}>
                                <Text category="s1" style={[styles.menuItemTitle, { color: '#FF3D71' }]}>
                                    Cerrar Sesión
                                </Text>
                                <Text category="c2" style={styles.menuItemSubtitle}>
                                    Salir de tu cuenta
                                </Text>
                            </View>
                        </View>
                        <ChevronRight size={20} color="#8F9BB3" />
                    </TouchableOpacity>
                </Card>

                {/* Incidents Section */}
                <View style={styles.incidentsSection}>
                    <IncidentList />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FC',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        borderBottomWidth: 1,
        borderBottomColor: '#E4E9F2',
        backgroundColor: '#FFFFFF',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2E3A59',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: LayoutConstants.spacing.xl,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: LayoutConstants.spacing.lg,
    },
    loadingText: {
        marginTop: LayoutConstants.spacing.md,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '500',
        color: '#8F9BB3',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: LayoutConstants.spacing.lg,
    },
    errorText: {
        textAlign: 'center',
        color: '#FF3D71',
        fontSize: 16,
        fontWeight: '500',
        marginBottom: LayoutConstants.spacing.md,
    },
    retryButton: {
        marginTop: LayoutConstants.spacing.md,
    },
    profileCard: {
        marginHorizontal: LayoutConstants.spacing.md,
        marginTop: LayoutConstants.spacing.md,
        padding: LayoutConstants.spacing.md,
        backgroundColor: '#ffffff',
        borderRadius: LayoutConstants.borderRadius.md,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        marginRight: LayoutConstants.spacing.md,
    },
    profileInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2E3A59',
        marginBottom: 2,
    },
    userAlias: {
        fontSize: 14,
        fontWeight: '500',
        color: '#8F9BB3',
        fontStyle: 'italic',
        marginBottom: 2,
    },
    userZone: {
        fontSize: 14,
        color: '#8F9BB3',
        marginBottom: LayoutConstants.spacing.xs,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: LayoutConstants.spacing.xs,
    },
    statusActive: {
        backgroundColor: '#00C48C',
    },
    statusInactive: {
        backgroundColor: '#FF3D71',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statusTextActive: {
        color: '#00C48C',
    },
    statusTextInactive: {
        color: '#FF3D71',
    },
    menuCard: {
        marginHorizontal: LayoutConstants.spacing.md,
        marginTop: LayoutConstants.spacing.md,
        padding: LayoutConstants.spacing.md,
        backgroundColor: '#ffffff',
        borderRadius: LayoutConstants.borderRadius.md,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2E3A59',
        marginBottom: LayoutConstants.spacing.sm,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: LayoutConstants.spacing.sm,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: LayoutConstants.spacing.md,
    },
    menuItemContent: {
        flex: 1,
    },
    menuItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2E3A59',
        marginBottom: 2,
    },
    menuItemSubtitle: {
        fontSize: 14,
        color: '#8F9BB3',
    },
    divider: {
        marginVertical: LayoutConstants.spacing.sm,
        backgroundColor: '#F7F9FC',
    },
    incidentsSection: {
        flex: 1,
        marginTop: LayoutConstants.spacing.md,
    },
});

export default ProfileScreen;
