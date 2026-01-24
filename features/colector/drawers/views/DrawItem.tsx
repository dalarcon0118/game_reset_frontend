import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Flex, Label, Badge, ButtonKit } from '@shared/components';
import { Clock, DollarSign } from 'lucide-react-native';
import { useTheme } from '@shared/hooks/useTheme';
import { COLORS } from '@/shared/components/constants';
import { useFinancialStore } from '@/shared/store/financial/store';
import { match } from 'ts-pattern';

interface Draw {
    draw_id: number;
    draw_name: string;
    status: 'open' | 'scheduled' | 'closed' | 'completed' | 'cancelled' | string;
    opening_time: string;
    closing_time: string;
    total_collected: number;
    total_paid: number;
    net_result: number;
    winning_number?: string | null;
    status_closed?: 'success' | 'reported' | null;
}

interface DrawItemProps {
    draw: Draw;
    onConfirm?: (drawId: number) => void;
    onReport?: (drawId: number) => void;
}

const getStatusBadgeProps = (status: string) => {
    switch (status) {
        case 'open':
            return { content: 'Abierto', textColor: COLORS.primaryDark, color: '#E6FFFA' };
        case 'scheduled':
            return { content: 'Programado', textColor: '#8A8A8A', color: '#F5F5F5' };
        case 'closed':
            return { content: 'Cerrado', textColor: '#E53E3E', color: '#FFF5F5' };
        case 'completed':
            return { content: 'Completado', textColor: '#3182CE', color: '#EBF8FF' };
        case 'cancelled':
            return { content: 'Cancelado', textColor: '#718096', color: '#EDF2F7' };
        default:
            return { content: status, textColor: COLORS.textDark, color: '#F7F9FC' };
    }
};

export const DrawItem: React.FC<DrawItemProps> = ({ draw, onConfirm, onReport }) => {
    const { colors, spacing } = useTheme();
    const { model, dispatch } = useFinancialStore();
    const financialData = model.drawSummaries[draw.draw_id];

    // Debug log to verify data
    console.log(`[DrawItem] ${draw.draw_name} (${draw.draw_id}) status_closed:`, draw.status_closed);

    const badgeProps = getStatusBadgeProps(draw.status);
    const isClosed = ['closed', 'completed', 'cancelled'].includes(draw.status);
    const isOpen = draw.status === 'open';
    const isScheduled = draw.status === 'scheduled';
    const isSuccess = draw.status_closed === 'success';
    const isReported = draw.status_closed === 'reported';
    const isNull = draw.status_closed === null;

    useEffect(() => {
        // Disparar la carga del estado financiero para este sorteo si no existe
        dispatch({ type: 'FETCH_DRAW_SUMMARY_REQUESTED', drawId: draw.draw_id });
    }, [draw.draw_id]);

    const renderFinancialDetails = () => {
        return match(financialData)
            .with({ type: 'Loading' }, () => (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.sm }} />
            ))
            .with({ type: 'Success' }, ({ data }) => (
                <Flex vertical gap={spacing.xs}>
                    <Flex justify="between">
                        <Label type="detail" value="Total recaudado (REST):" />
                        <Label type="detail" value={data.totalCollected.toLocaleString()} />
                    </Flex>
                    <Flex justify="between">
                        <Label type="detail" value="Pagado:" />
                        <Label type="detail" value={data.premiumsPaid.toLocaleString()} />
                    </Flex>
                    <Flex justify="between">
                        <Label type="detail" value="Neto:" />
                        <Label type="header" value={data.netResult.toLocaleString()} />
                    </Flex>
                </Flex>
            ))
            .with({ type: 'Failure' }, ({ error }) => (
                 <Label type="detail" value={`Error: ${error}`} style={{ color: colors.error }} />
             ))
            .otherwise(() => null);
    };

    const renderActions = () => {
        if (isNull) {
            return (
                <Flex gap={spacing.md} style={{ marginTop: spacing.lg }}>
                    <ButtonKit
                        label="Confirmar"
                        style={{ flex: 1 }}
                        size="small"
                        appearance="filled"
                        status="primary"
                        onPress={() => onConfirm?.(draw.draw_id)}
                    />
                    <ButtonKit
                        label="Reportar"
                        style={{ flex: 1 }}
                        size="small"
                        appearance="outline"
                        status="danger"
                        onPress={() => onReport?.(draw.draw_id)}
                    />
                </Flex>
            );
        }
        return null;
    };

    return (
        <View
            style={[
                styles.drawCard,
                {
                    backgroundColor: colors.surface,
                    marginBottom: spacing.lg,
                    borderRadius: 16,
                    padding: 0, // Reset padding for inner content
                    borderWidth: 1,
                    borderColor: colors.border
                }
            ]}
        >
            {/* Success Indicator Bar */}
            {(
                <View style={{
                    height: 4,
                    width: '100%',
                    backgroundColor: isSuccess ? COLORS.success : isReported ? COLORS.danger : COLORS.border,
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16
                }} />
            )}

            <View style={{ padding: spacing.lg }}>
                <Flex justify="between" align="center" style={{ marginBottom: spacing.md }}>
                    <Label type="header" value={draw.draw_name} />
                   
                </Flex>

                <Flex vertical gap={spacing.md}>
                    {/* Time Range - Always Visible */}
                     <Badge {...badgeProps} />
                    <Flex gap={spacing.xl}>
                        <Flex align="center" gap={spacing.xs}>
                            <Clock size={16} color={colors.textSecondary} />
                            <Label type="detail" value={`${draw.opening_time} - ${draw.closing_time}`} />
                        </Flex>
                    </Flex>

                    {/* Open: Only Total Collected */}
                    {isOpen && (
                        <Flex align="center" gap={spacing.xs}>
                            <DollarSign size={16} color={colors.primary} />
                            <Label type="detail" value={`Recaudado: ${draw.total_collected.toLocaleString()}`} />
                        </Flex>
                    )}

                    {/* Closed/Completed/Cancelled: Full details */}
                    {isClosed && (
                        <Flex vertical gap={spacing.xs}>
                            <Flex justify="between">
                                <Label type="detail" value="Jugada de premio:" />
                                <Label type="detail" value={draw.winning_number || '---'} />
                            </Flex>
                            
                            {/* Nuevos detalles financieros desde REST API */}
                            {renderFinancialDetails()}

                            {/* Action Buttons - Only show if not fully confirmed/success */}
                            {renderActions()}
                        </Flex>
                    )}
                </Flex>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    drawCard: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    }
});
