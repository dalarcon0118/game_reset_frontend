import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Select, SelectItem, IndexPath } from '@ui-kitten/components';
import { Flex, Label, Card, Badge, ButtonKit } from '@/shared/components';
import { useTheme } from '@/shared/hooks/use_theme';
import { CheckCircle2, AlertCircle, Clock, ChevronRight, Edit3 } from 'lucide-react-native';

export interface ReportItemProps {
    id: string;
    listeriaName: string;
    drawName: string;
    date: string;
    status: 'OK' | 'Discrepancia';
    discrepancyStatus?: 'Abierto' | 'En proceso' | 'Resuelta' | 'Cancelada';
    description: string;
    incidentType: string;
    onPress?: () => void;
    fetchIncidents?: () => Promise<void>;
    onUpdateStatus?: (id: string, status: string, notes: string) => Promise<void>;
}

const getStatusBadgeProps = (status: ReportItemProps['status']) => {
    if (status === 'OK') {
        return { content: 'Status OK', textColor: '#2F855A', color: '#F0FFF4' };
    }
    return { content: 'Discrepancia', textColor: '#C53030', color: '#FFF5F5' };
};

const getDiscrepancyBadgeProps = (status: ReportItemProps['discrepancyStatus']) => {
    switch (status) {
        case 'Abierto':
            return { content: 'Abierto', textColor: '#C53030', color: '#FFF5F5' };
        case 'En proceso':
            return { content: 'En proceso', textColor: '#C05621', color: '#FFFAF0' };
        case 'Resuelta':
            return { content: 'Resuelta', textColor: '#2B6CB0', color: '#EBF8FF' };
        case 'Cancelada':
            return { content: 'Cancelada', textColor: '#718096', color: '#EDF2F7' };
        default:
            return null;
    }
};

const getStatusIcon = (status: ReportItemProps['status']) => {
    if (status === 'OK') {
        return <CheckCircle2 size={20} color="#38A169" />;
    }
    return <AlertCircle size={20} color="#E53E3E" />;
};

export const ReportItem: React.FC<ReportItemProps> = ({
    id,
    status,
    discrepancyStatus,
    listeriaName,
    incidentType,
    drawName,
    date,
    description,
    onPress,
    fetchIncidents,
    onUpdateStatus
}) => {
    const { colors, spacing } = useTheme();
    const statusBadge = getStatusBadgeProps(status);
    const discrepancyBadge = getDiscrepancyBadgeProps(discrepancyStatus);

    const [isExpanded, setIsExpanded] = useState(false);
    const [updateNotes, setUpdateNotes] = useState('');
    const [selectedStatusIndex, setSelectedStatusIndex] = useState<IndexPath>(new IndexPath(0));
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<TextInput>(null);

    const statusOptions = ['Abierto', 'En proceso', 'Resuelta', 'Cancelada'];
    const displayStatus = statusOptions[selectedStatusIndex.row];

    useEffect(() => {
        if (isExpanded && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isExpanded]);

    useEffect(() => {
        // Set initial status based on current discrepancyStatus
        if (discrepancyStatus) {
            const index = statusOptions.indexOf(discrepancyStatus);
            if (index !== -1) {
                setSelectedStatusIndex(new IndexPath(index));
            }
        }
    }, [discrepancyStatus]);

    const handleSaveUpdate = async () => {
        if (!onUpdateStatus || !updateNotes.trim()) return;

        setIsSaving(true);
        try {
            // Ahora pasamos el estado seleccionado y las notas
            await onUpdateStatus(id, displayStatus, updateNotes);
            setUpdateNotes('');
            setIsExpanded(false);
            // Recarga la lista de forma segura
            await fetchIncidents?.();
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelUpdate = () => {
        setUpdateNotes('');
        setIsExpanded(false);
    };

    const renderUpdateForm = () => {
        return (
            <View style={[styles.updateForm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* Status Selector */}
                <View style={{ marginBottom: spacing.sm }}>
                    <Label type="detail" value="Nuevo estado:" style={{ marginBottom: spacing.xs, fontWeight: '600' }} />
                    <Select
                        selectedIndex={selectedStatusIndex}
                        value={displayStatus}
                        onSelect={(index) => setSelectedStatusIndex(index as IndexPath)}
                        style={styles.statusSelect}
                    >
                        {statusOptions.map((status) => (
                            <SelectItem key={status} title={status} />
                        ))}
                    </Select>
                </View>

                {/* Notes Input */}
                <View>
                    <Label type="detail" value="Notas:" style={{ marginBottom: spacing.xs, fontWeight: '600' }} />
                    <TextInput
                        ref={inputRef}
                        style={[
                            styles.textInput,
                            {
                                color: colors.text,
                                backgroundColor: colors.background,
                                borderColor: colors.border
                            }
                        ]}
                        placeholder="Agregar notas sobre la actualización..."
                        placeholderTextColor={colors.textSecondary}
                        value={updateNotes}
                        onChangeText={setUpdateNotes}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />
                </View>
                <Flex gap={spacing.sm} style={{ marginTop: spacing.sm }}>
                    <ButtonKit
                        label="Guardar cambios"
                        size="small"
                        appearance="filled"
                        status="primary"
                        onPress={handleSaveUpdate}
                        disabled={!updateNotes.trim() || isSaving}
                        style={{ flex: 1 }}
                    />
                    <ButtonKit
                        label="Cancelar"
                        size="small"
                        appearance="outline"
                        status="basic"
                        onPress={handleCancelUpdate}
                        disabled={isSaving}
                        style={{ flex: 1 }}
                    />
                </Flex>
            </View>
        );
    };

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Card style={styles.reportCard}>
                <Flex gap={spacing.md} align="start">
                    <View style={styles.iconContainer}>
                        {getStatusIcon(status)}
                    </View>

                    <Flex vertical flex={1} gap={spacing.xs}>
                        <Flex justify="between" align="center">
                            <Label type="header" value={listeriaName} />
                            <Badge {...statusBadge} />
                        </Flex>

                        <Flex justify="between" align="center">
                            <Label type="detail" value={incidentType} style={{ fontWeight: '700', fontSize: 13, color: colors.text }} />
                        </Flex>

                        <Label type="detail" value={drawName} style={styles.drawName} />

                        <Flex align="center" gap={spacing.xs}>
                            <Clock size={14} color={colors.textSecondary} />
                            <Label type="detail" value={date} />
                        </Flex>

                        <View style={styles.divider} />

                        {status === 'Discrepancia' && discrepancyStatus && (
                            <Flex align="center" gap={spacing.sm} style={{ marginBottom: spacing.xs }}>
                                <Label type="detail" value="Estado:" style={{ fontWeight: '600' }} />
                                <Badge {...discrepancyBadge!} />
                            </Flex>
                        )}

                        <Label
                            type="detail"
                            value={description}
                            numberOfLines={2}
                            style={[
                                styles.description,
                                { fontStyle: status === 'OK' ? 'normal' : 'italic' }
                            ]}
                        />

                        {/* Update Status Section */}
                        {status === 'Discrepancia' && discrepancyStatus !== 'Resuelta' && discrepancyStatus !== 'Cancelada' && (
                            <View style={{ marginTop: spacing.sm }}>
                                {!isExpanded ? (
                                    <TouchableOpacity
                                        onPress={() => setIsExpanded(true)}
                                        style={[styles.updateButton, { borderColor: colors.border }]}
                                    >
                                        <Edit3 size={16} color={colors.primary} />
                                        <Label
                                            type="detail"
                                            value="Actualizar estado"
                                            style={{ color: colors.primary, marginLeft: spacing.xs }}
                                        />
                                    </TouchableOpacity>
                                ) : (
                                    renderUpdateForm()
                                )}
                            </View>
                        )}
                    </Flex>

                    <ChevronRight size={20} color={colors.border} style={{ alignSelf: 'center' }} />
                </Flex>
            </Card>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    reportCard: {
        marginBottom: 4,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    iconContainer: {
        marginTop: 2,
    },
    drawName: {
        fontWeight: '600',
        color: '#4A5568',
    },
    divider: {
        height: 1,
        backgroundColor: '#EDF2F7',
        marginVertical: 4,
    },
    description: {
        color: '#718096',
    },
    updateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    updateForm: {
        padding: 0,
        marginTop: 0,
        marginLeft: -30,
        marginRight: -30,
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 10,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        minHeight: 80,
    },
    statusSelect: {
        borderRadius: 8,
    }
});