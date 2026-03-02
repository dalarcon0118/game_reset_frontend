import React, { useMemo, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Select, SelectItem, IndexPath, Datepicker } from '@ui-kitten/components';
import { Flex, Label, Card } from '@/shared/components';
import { Search, Filter } from 'lucide-react-native';
import { useTheme } from '@/shared/hooks/use_theme';
import { useAuth } from '../../auth';
import { incidentRepository, Incident } from '@/shared/repositories/incident';
import { useDataFetch } from '@/shared/hooks/use_data_fetch';
import { useIsFocused } from '@react-navigation/native';
import { ReportItem } from './components/report_item';
import { mapIncidentToReport, Report } from './utils';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('COLECTOR_REPORTS_LIST');

export default function ReportsListScreen() {
    const { colors, spacing } = useTheme();
    const isFocused = useIsFocused();
    const { isAuthenticated } = useAuth();

    const [selectedStatusIndex, setSelectedStatusIndex] = React.useState<IndexPath | undefined>(new IndexPath(0));
    const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
    const [showFilters, setShowFilters] = React.useState(false);

    const [fetchIncidents, incidents, loading] = useDataFetch<Incident[], [any]>(incidentRepository.list.bind(incidentRepository));

    const statusOptions = useMemo(() => [
        { label: 'Abierto', value: 'pending' },
        { label: 'En proceso', value: 'in_review' },
        { label: 'Resuelta', value: 'resolved' },
        { label: 'Cancelada', value: 'cancelled' }
    ], []);

    const handleUpdateStatus = async (id: string, status: string, notes: string) => {
        // Map UI status back to backend status
        const statusMap: Record<string, string> = {
            'Abierto': 'pending',
            'En proceso': 'in_review',
            'Resuelta': 'resolved',
            'Cancelada': 'cancelled'
        };

        const backendStatus = statusMap[status] || 'pending';

        try {
            await incidentRepository.updateStatus(id, backendStatus, notes);
            // Refresh with current filters
            loadData();
        } catch (error) {
            log.error('Error updating status in screen', { error, incidentId: id, status: backendStatus });
            throw error;
        }
    };

    const loadData = useCallback(async () => {
        if (isFocused && isAuthenticated) {
            const params: any = {
                ordering: '-updated_at' // Default ordering by modification date
            };
            if (selectedStatusIndex) {
                params.status = statusOptions[selectedStatusIndex.row].value;
            }
            if (selectedDate) {
                params.date = selectedDate.toISOString().split('T')[0];
            }
            await fetchIncidents(params);
        }
    }, [isFocused, isAuthenticated, selectedStatusIndex, selectedDate, fetchIncidents, statusOptions]);

    React.useEffect(() => {
        loadData();
    }, [loadData]);

    const clearFilters = () => {
        setSelectedStatusIndex(undefined);
        setSelectedDate(null);
    };

    const reports: Report[] = incidents ? incidents.map(mapIncidentToReport) : [];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Flex vertical flex={1}>
                {/* Header */}
                <Flex align="center" justify="between" padding={spacing.lg} style={styles.header}>
                    <Label type="title" value="Reportes de Colecturía" />
                    <Flex gap={spacing.sm}>
                        <TouchableOpacity 
                            style={[styles.iconButton, showFilters && { backgroundColor: colors.primary + '20' }]} 
                            onPress={() => setShowFilters(!showFilters)}
                        >
                            <Filter size={22} color={showFilters ? colors.primary : colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButton}>
                            <Search size={22} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </Flex>
                </Flex>

                {showFilters && (
                    <Card style={styles.filterCard}>
                        <Flex vertical gap={spacing.md}>
                            <Flex justify="between" align="center">
                                <Label type="detail" value="Filtros" style={{ fontWeight: 'bold' }} />
                                {(selectedStatusIndex || selectedDate) && (
                                    <TouchableOpacity onPress={clearFilters}>
                                        <Label type="detail" value="Limpiar" style={{ color: colors.primary }} />
                                    </TouchableOpacity>
                                )}
                            </Flex>
                            
                            <Flex gap={spacing.md}>
                                <View style={{ flex: 1 }}>
                                    <Label type="detail" value="Estado" style={{ marginBottom: spacing.xs }} />
                                    <Select
                                        placeholder="Todos"
                                        selectedIndex={selectedStatusIndex}
                                        value={selectedStatusIndex ? statusOptions[selectedStatusIndex.row].label : 'Todos'}
                                        onSelect={(index) => setSelectedStatusIndex(index as IndexPath)}
                                    >
                                        {statusOptions.map((opt: { label: string, value: string }) => (
                                            <SelectItem key={opt.value} title={opt.label} />
                                        ))}
                                    </Select>
                                </View>
                                
                                <View style={{ flex: 1 }}>
                                    <Label type="detail" value="Fecha" style={{ marginBottom: spacing.xs }} />
                                    <Datepicker
                                        placeholder="Cualquier fecha"
                                        date={selectedDate || undefined}
                                        onSelect={nextDate => setSelectedDate(nextDate)}
                                    />
                                </View>
                            </Flex>
                        </Flex>
                    </Card>
                )}

                <ScrollView
                    contentContainerStyle={{ padding: spacing.lg }}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={loadData} />
                    }
                >
                    <Flex vertical gap={spacing.md}>
                        {!loading && reports.length === 0 && (
                            <Card style={[styles.emptyCard, { alignItems: 'center', padding: spacing.xl }]}>
                                <Label type="detail" value="No hay reportes registrados." />
                            </Card>
                        )}

                        {reports.map((report) => (
                            <ReportItem
                                key={report.id}
                                fetchIncidents={loadData}
                                onUpdateStatus={handleUpdateStatus}
                                {...report}
                                onPress={() => {
                                    log.debug('Report pressed', { reportId: report.id });
                                }}
                            />
                        ))}
                    </Flex>
                </ScrollView>
            </Flex>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    iconButton: {
        padding: 8,
        borderRadius: 8,
    },
    filterCard: {
        margin: 16,
        marginBottom: 0,
        borderRadius: 12,
        padding: 4,
    },
    emptyCard: {
        borderRadius: 12,
    }
});
