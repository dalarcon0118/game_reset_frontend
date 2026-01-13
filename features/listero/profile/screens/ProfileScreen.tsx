import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Layout, Text, Button, Icon, Divider, Card, ListItem } from '@ui-kitten/components';
import { match } from 'ts-pattern';
import Colors from '@/constants/Colors';
import LayoutConstants from '@/constants/Layout';
import { ProfileMsgType } from '../profile.types';
import { useProfileStore, selectProfileModel, selectDispatch, selectInit } from '../store';
import { ArchiveIcon, ArrowRightIcon, ListIcon, PrinterIcon, LockIcon, LogOutIcon } from 'lucide-react-native';

export const ProfileScreen = () => {
    const model = useProfileStore(selectProfileModel);
    const dispatch = useProfileStore(selectDispatch);
    const init = useProfileStore(selectInit);

    // Initial fetch on mount
    useEffect(() => {
        init();
    }, [init]);

    // Safety check for model initialization
    if (!model) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" />
                </View>
            </SafeAreaView>
        );
    }

    const renderContent = () => {
        return match(model.user)
            .with({ type: 'Loading' }, () => (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" />
                </View>
            ))
            .with({ type: 'Failure' }, ({ error }) => (
                <View style={styles.centerContainer}>
                    <Text status="danger">{error}</Text>
                    <Button
                        size="small"
                        onPress={() => dispatch({ type: ProfileMsgType.INIT })}
                        style={{ marginTop: 10 }}
                    >
                        Reintentar
                    </Button>
                </View>
            ))
            .with({ type: 'Success' }, ({ data: user }) => (
                <ScrollView style={styles.contentContainer}>
                    {/* Identity Header */}
                    <View style={styles.headerSection}>
                        <View style={styles.avatarPlaceholder}>
                            <Text category="h4" style={{ color: 'white' }}>
                                {user.firstName.charAt(0)}{user.alias.charAt(0)}
                            </Text>
                        </View>
                        <Text category="h5" style={styles.nameText}>{user.firstName}</Text>
                        <Text category="s1" appearance="hint">"{user.alias}"</Text>
                        <View style={styles.badgeContainer}>
                            <Text status={user.status === 'ACTIVE' ? 'success' : 'basic'} category="c1">
                                {user.status}
                            </Text>
                            <Text category="c1" appearance="hint"> • {user.zone}</Text>
                        </View>
                    </View>

                    <Divider />

                    {/* Management Tools */}
                    <View style={styles.section}>
                        <Text category="h6" style={styles.sectionTitle}>Herramientas de Gestión</Text>
                        <Card style={styles.card} disabled>
                            <ListItem
                                title="Cierre de Caja"
                                description="Registrar entrega de efectivo"
                                accessoryLeft={(props) => <ArchiveIcon color='#8F9BB3' size={24} />}
                                accessoryRight={(props) => <ArrowRightIcon color='#8F9BB3' size={24} />}
                                onPress={() => dispatch({ type: ProfileMsgType.NAVIGATE_TO, route: 'close-register' })}
                            />
                            <Divider />
                            <ListItem
                                title="Historial de Cierres"
                                description="Ver entregas pasadas"
                                accessoryLeft={(props) => <ListIcon color='#8F9BB3' size={24} />}
                                accessoryRight={(props) => <ArrowRightIcon color='#8F9BB3' size={24} />}
                                onPress={() => dispatch({ type: ProfileMsgType.NAVIGATE_TO, route: 'history' })}
                            />
                            <Divider />

                        </Card>
                    </View>

                    {/* Security */}
                    <View style={styles.section}>
                        <Text category="h6" style={styles.sectionTitle}>Seguridad</Text>
                        <Card style={styles.card} disabled>
                            <ListItem
                                title="Cambiar Contraseña"
                                accessoryLeft={(props) => <LockIcon color='#8F9BB3' size={24} />}
                                accessoryRight={(props) => <ArrowRightIcon color='#8F9BB3' size={24} />}
                                onPress={() => dispatch({ type: ProfileMsgType.NAVIGATE_TO, route: 'change-password' })}
                            />
                            <Divider />
                            <ListItem
                                title="Cerrar Sesión"
                                accessoryLeft={(props) => <LogOutIcon color='#8F9BB3' size={24} />}
                                onPress={() => Alert.alert('Cerrar Sesión', '¿Estás seguro?', [
                                    { text: 'Cancelar', style: 'cancel' },
                                    { text: 'Salir', style: 'destructive', onPress: () => dispatch({ type: ProfileMsgType.LOGOUT_REQUESTED }) }
                                ])}
                            />
                        </Card>
                    </View>

                    <Text appearance="hint" category="c1" style={styles.versionText}>
                        Versión 1.0.0
                    </Text>

                </ScrollView>
            ))
            .with({ type: 'NotAsked' }, () => null) // Should not happen due to initial loading
            .exhaustive();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Layout style={styles.container} level="2">
                {renderContent()}
            </Layout>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        paddingBottom: 40,
    },
    headerSection: {
        backgroundColor: 'white',
        alignItems: 'center',
        paddingVertical: 24,
        marginBottom: 16,
    },
    avatarPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.light.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    nameText: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    badgeContainer: {
        flexDirection: 'row',
        marginTop: 8,
        alignItems: 'center',
        backgroundColor: '#F7F9FC',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    section: {
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        marginBottom: 8,
        marginLeft: 4,
        color: '#8F9BB3',
    },
    card: {
        padding: 0,
        borderRadius: 8,
        borderWidth: 0,
    },
    versionText: {
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 32,
    },
});
