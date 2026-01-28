import React from 'react';
import { View, StyleSheet } from 'react-native';
import StyledText from '@/components/typography/styled_text';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';

export const ColumnHeaders: React.FC = () => {
    return (
        <View style={styles.columnHeaderRow}>
            <StyledText style={[styles.columnHeader, styles.colFijos]}>Fijos y Corridos</StyledText>
            <StyledText style={[styles.columnHeader, styles.colParlet]}>Parlet</StyledText>
            <StyledText style={[styles.columnHeader, styles.colCentenas]}>Centenas</StyledText>
        </View>
    );
};

const styles = StyleSheet.create({
    columnHeaderRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
        paddingVertical: Layout.spacing.sm,
    },
    columnHeader: {
        fontWeight: 'bold',
        textAlign: 'center',
    },
    colFijos: { flex: 3 },
    colParlet: { flex: 2 },
    colCentenas: { flex: 2 },
});
