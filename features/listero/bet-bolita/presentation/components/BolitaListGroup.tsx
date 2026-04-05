import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Eye } from 'lucide-react-native';
import Colors from '@/constants/colors';
import FijosCorridosColumn from './fijos_corridos_column';
import { ParletColumn } from './parlet_column';
import { CentenaColumn } from './centena_column';

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

    return (
        <View style={styles.groupContainer}>
            {receiptCode !== '-----' && (
                <View style={styles.groupHeader}>
                    <Text style={styles.groupHeaderText}>Comprobante: {receiptCode}</Text>
                    <TouchableOpacity
                        onPress={() => onViewReceipt(receiptCode)}
                        style={styles.eyeButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Eye size={20} color={Colors[colorScheme].primary} />
                    </TouchableOpacity>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    groupHeaderText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
    },
    eyeButton: {
        padding: 4,
    },
    gridContainer: {
        flexDirection: 'row',
        paddingHorizontal: 8,
    },
    columnWrapperFijos: { flex: 3, borderRightWidth: 1, borderRightColor: '#E8E8E8' },
    columnWrapperParlet: { flex: 2, borderRightWidth: 1, borderRightColor: '#E8E8E8' },
    columnWrapperCentena: { flex: 2 },
});
