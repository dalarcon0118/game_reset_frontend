import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import Colors from '@/constants/colors';
import FijosCorridosColumn from '@/features/bet-bolita/standard/components/fijos_corridos_column';
import { ParletColumn } from '@/features/bet-bolita/parlet/components/parlet_column';
import { CentenaColumn } from '@/features/bet-bolita/centena/components/centena_column';

interface BolitaListGroupProps {
    receiptCode: string;
    group: {
        fijosCorridos: any[];
        parlets: any[];
        centenas: any[];
    };
    onViewReceipt: (receiptCode: string) => void;
}

export const BolitaListGroup: React.FC<BolitaListGroupProps> = ({ 
    receiptCode, 
    group, 
    onViewReceipt 
}) => {
    const colorScheme = (useColorScheme() ?? 'light') as keyof typeof Colors;
    const hasBets = group.fijosCorridos.length > 0 || 
                    group.centenas.length > 0 || 
                    group.parlets.length > 0;

    return (
        <View style={styles.groupContainer}>
            {receiptCode !== '-----' && (
                <View style={styles.groupHeader}>
                    <Text style={styles.groupHeaderText}>Comprobante: {receiptCode}</Text>
                </View>
            )}
            <View style={styles.gridContainer}>
                <View style={styles.columnWrapperFijos}>
                    <FijosCorridosColumn editable={false} data={group.fijosCorridos} />
                </View>
                <View style={styles.columnWrapperParlet}>
                    <ParletColumn fijosCorridosList={group.fijosCorridos} editable={false} data={group.parlets} />
                </View>
                <View style={styles.columnWrapperCentena}>
                    <CentenaColumn editable={false} data={group.centenas} />
                </View>
            </View>

            {/* Separador con botón "Ver comprobante" */}
            {hasBets && (
                <View style={styles.receiptSeparator}>
                    <TouchableOpacity
                        style={[styles.receiptButton, { backgroundColor: Colors[colorScheme].primary }]}
                        onPress={() => onViewReceipt(receiptCode)}
                    >
                        <Text style={styles.receiptButtonText}>Ver comprobante</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    groupContainer: {
        marginBottom: 10,
    },
    groupHeader: {
        backgroundColor: '#f8f8f8',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    groupHeaderText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
    },
    gridContainer: {
        flexDirection: 'row',
        paddingHorizontal: 8,
    },
    columnWrapperFijos: { flex: 3, borderRightWidth: 1, borderRightColor: '#E8E8E8' },
    columnWrapperParlet: { flex: 2, borderRightWidth: 1, borderRightColor: '#E8E8E8' },
    columnWrapperCentena: { flex: 2 },
    receiptSeparator: {
        padding: 10,
        backgroundColor: '#f0f0f0',
        marginHorizontal: 8,
        marginVertical: 5,
        borderRadius: 8,
    },
    receiptButton: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    receiptButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
