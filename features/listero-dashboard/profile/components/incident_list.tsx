import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, Spinner, Button } from '@ui-kitten/components';
import { AlertTriangle, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react-native';
import { useProfileStore, selectProfileModel, selectDispatch } from '../store';
import { ProfileMsgType } from '../profile.types';
import { RemoteData } from '@/shared/core/remote.data';
import LayoutConstants from '@/constants/layout';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FC',
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
    headerCard: {
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
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        marginRight: LayoutConstants.spacing.md,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2E3A59',
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#8F9BB3',
        fontWeight: '400',
    },
    emptyCard: {
        marginHorizontal: LayoutConstants.spacing.md,
        marginTop: LayoutConstants.spacing.md,
        padding: LayoutConstants.spacing.xl,
        backgroundColor: '#ffffff',
        borderRadius: LayoutConstants.borderRadius.md,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    emptyContent: {
        alignItems: 'center',
        padding: LayoutConstants.spacing.xl,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2E3A59',
        marginTop: LayoutConstants.spacing.md,
        marginBottom: LayoutConstants.spacing.sm,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#8F9BB3',
        textAlign: 'center',
        lineHeight: 20,
    },
    incidentsContainer: {
        padding: LayoutConstants.spacing.md,
        paddingTop: 0,
    },
    incidentCard: {
        marginBottom: LayoutConstants.spacing.md,
        padding: LayoutConstants.spacing.md,
        backgroundColor: '#ffffff',
        borderRadius: LayoutConstants.borderRadius.md,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    incidentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: LayoutConstants.spacing.sm,
    },
    incidentTypeContainer: {
        flex: 1,
        marginRight: LayoutConstants.spacing.md,
    },
    incidentType: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2E3A59',
        lineHeight: 20,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7F9FC',
        paddingHorizontal: LayoutConstants.spacing.sm,
        paddingVertical: LayoutConstants.spacing.xs,
        borderRadius: LayoutConstants.borderRadius.sm,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: LayoutConstants.spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    incidentDescription: {
        fontSize: 14,
        color: '#8F9BB3',
        lineHeight: 20,
        marginBottom: LayoutConstants.spacing.sm,
    },
    incidentFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    structureText: {
        fontSize: 12,
        color: '#8F9BB3',
        fontWeight: '500',
    },
    dateText: {
        fontSize: 12,
        color: '#8F9BB3',
        fontWeight: '500',
    },
    drawContainer: {
        marginTop: LayoutConstants.spacing.xs,
    },
    drawText: {
        fontSize: 12,
        color: '#8F9BB3',
        fontStyle: 'italic',
    },
});

interface IncidentListProps {}

export const IncidentList: React.FC<IncidentListProps> = () => {
    const model = useProfileStore(selectProfileModel);
    const dispatch = useProfileStore(selectDispatch);

    const { incidents } = model;

    const handleRefresh = () => {
        dispatch({ type: ProfileMsgType.FETCH_INCIDENTS_REQUESTED });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock size={20} color="#FFAA00" />;
            case 'in_review':
                return <AlertTriangle size={20} color="#FF6B35" />;
            case 'resolved':
                return <CheckCircle size={20} color="#00C48C" />;
            case 'cancelled':
                return <XCircle size={20} color="#FF3D71" />;
            default:
                return <Clock size={20} color="#8F9BB3" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Pendiente';
            case 'in_review':
                return 'En Revisión';
            case 'resolved':
                return 'Resuelto';
            case 'cancelled':
                return 'Cancelado';
            default:
                return status;
        }
    };

    const getIncidentTypeText = (type: string) => {
        switch (type) {
            case 'Diferencia de Monto':
                return 'Diferencia de Monto';
            case 'Premio No Registrado':
                return 'Premio No Registrado';
            case 'Premio No Pagado':
                return 'Premio No Pagado';
            case 'Jugadas anotadas incorrectamente':
                return 'Jugadas Incorrectas';
            case 'Inyección de nuevos fondos':
                return 'Inyección de Fondos';
            case 'Otro':
                return 'Otro';
            default:
                return type;
        }
    };

    if (RemoteData.isLoading(incidents)) {
        return (
            <View style={styles.loadingContainer}>
                <Spinner size="large" />
                <Text style={styles.loadingText}>Cargando incidencias...</Text>
            </View>
        );
    }

    if (RemoteData.isFailure(incidents)) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error al cargar las incidencias</Text>
                <Button
                    onPress={handleRefresh}
                    accessoryLeft={(props) => <RefreshCw {...props} />}
                    style={styles.retryButton}
                >
                    Reintentar
                </Button>
            </View>
        );
    }

    const incidentsData = RemoteData.withDefault([], incidents);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[styles.scrollContent, { minHeight: '101%' }]}
            alwaysBounceVertical={true}
            refreshControl={
                <RefreshControl
                    refreshing={false}
                    onRefresh={handleRefresh}
                    colors={['#007AFF']}
                    tintColor="#007AFF"
                    title="Actualizando incidencias..."
                    titleColor="#007AFF"
                    progressViewOffset={20}
                />
            }
        >
            <Card style={styles.headerCard}>
                <View style={styles.headerContent}>
                    <AlertTriangle size={24} color="#FF6B35" style={styles.headerIcon} />
                    <View style={styles.headerTextContainer}>
                        <Text category="h6" style={styles.headerTitle}>Mis Incidencias</Text>
                        <Text category="s1" style={styles.headerSubtitle}>
                            {incidentsData.length} {incidentsData.length === 1 ? 'incidencia' : 'incidencias'}
                        </Text>
                    </View>
                </View>
            </Card>

            {incidentsData.length === 0 ? (
                <Card style={styles.emptyCard}>
                    <View style={styles.emptyContent}>
                        <CheckCircle size={48} color="#8F9BB3" />
                        <Text style={styles.emptyText}>No tienes incidencias reportadas</Text>
                        <Text style={styles.emptySubtext}>
                            Todas las operaciones se han procesado correctamente
                        </Text>
                    </View>
                </Card>
            ) : (
                <View style={styles.incidentsContainer}>
                    {incidentsData.map((incident) => (
                        <Card key={incident.id} style={styles.incidentCard}>
                            <View style={styles.incidentHeader}>
                                <View style={styles.incidentTypeContainer}>
                                    <Text category="s1" style={styles.incidentType}>
                                        {getIncidentTypeText(incident.incident_type)}
                                    </Text>
                                </View>
                                <View style={styles.statusContainer}>
                                    {getStatusIcon(incident.status)}
                                    <Text
                                        category="c2"
                                        style={[
                                            styles.statusText,
                                            incident.status === 'resolved' && { color: '#00C48C' },
                                            incident.status === 'cancelled' && { color: '#FF3D71' },
                                            incident.status === 'in_review' && { color: '#FF6B35' },
                                            incident.status === 'pending' && { color: '#FFAA00' },
                                        ]}
                                    >
                                        {getStatusText(incident.status)}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.incidentDescription}>
                                {incident.description.length > 100
                                    ? `${incident.description.substring(0, 100)}...`
                                    : incident.description
                                }
                            </Text>

                            <View style={styles.incidentFooter}>
                                <Text category="c2" style={styles.structureText}>
                                    {incident.structure_name}
                                </Text>
                                <Text category="c2" style={styles.dateText}>
                                    {new Date(incident.created_at).toLocaleDateString('es-ES')}
                                </Text>
                            </View>

                            {incident.draw_name && (
                                <View style={styles.drawContainer}>
                                    <Text category="c2" style={styles.drawText}>
                                        Sorteo: {incident.draw_name}
                                    </Text>
                                </View>
                            )}
                        </Card>
                    ))}
                </View>
            )}
        </ScrollView>
    );
};

export default IncidentList;
