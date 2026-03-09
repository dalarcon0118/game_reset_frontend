import React from 'react';
import { View, StyleSheet } from 'react-native';
import FijosCorridosColumn from './fijos_corridos_column';
import { ParletColumn } from './parlet_column';
import { CentenaColumn } from './centena_column';
import { BolitaListData } from '../../domain/models/bolita.types';

interface BolitaEntryColumnsProps {
    entrySession: BolitaListData;
    editable?: boolean;
}

export const BolitaEntryColumns: React.FC<BolitaEntryColumnsProps> = ({ entrySession, editable = true }) => {
    return (
        <View style={styles.betContainer}>
            <View style={styles.columnsContainer}>
                <View style={styles.columnWrapperFijos}>
                    <FijosCorridosColumn editable={editable} />
                </View>
                <View style={styles.columnWrapperParlet}>
                    <ParletColumn fijosCorridosList={entrySession.fijosCorridos} editable={editable} />
                </View>
                <View style={styles.columnWrapperCentena}>
                    <CentenaColumn editable={editable} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    betContainer: { 
        flexDirection: "column" 
    },
    columnsContainer: { 
        flexDirection: 'row', 
        flex: 1 
    },
    columnWrapperFijos: { 
        flex: 3, 
        borderRightWidth: 1, 
        borderRightColor: '#E8E8E8' 
    },
    columnWrapperParlet: { 
        flex: 2, 
        borderRightWidth: 1, 
        borderRightColor: '#E8E8E8' 
    },
    columnWrapperCentena: { 
        flex: 2 
    },
});
