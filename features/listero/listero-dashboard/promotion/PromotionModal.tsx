import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { PromotionSlider } from './PromotionSlider';
import { WebData } from '@/shared/core/tea-utils';
import { Promotion } from './model';
import { match } from 'ts-pattern';

interface PromotionModalProps {
    promotions: WebData<Promotion[]>;
    isVisible: boolean;
    onClose: () => void;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({ promotions, isVisible, onClose }) => {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    {match(promotions)
                        .with({ type: 'NotAsked' }, () => <Text>Cargando promociones...</Text>)
                        .with({ type: 'Loading' }, () => <ActivityIndicator size="large" color="#0000ff" />)
                        .with({ type: 'Failure' }, ({ error }) => <Text>Error al cargar promociones: {error.message}</Text>)
                        .with({ type: 'Success' }, ({ data }) => (
                            data.length > 0 ? (
                                <PromotionSlider promotions={data} />
                            ) : (
                                <Text>No hay promociones disponibles.</Text>
                            )
                        ))
                        .exhaustive()}

                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                    >
                        <Text style={styles.textStyle}>Cerrar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '90%',
        maxHeight: '80%',
    },
    closeButton: {
        backgroundColor: '#2196F3',
        borderRadius: 20,
        padding: 10,
        elevation: 2,
        marginTop: 15,
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
