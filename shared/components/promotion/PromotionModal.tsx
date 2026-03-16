import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { Text, Icon } from '@ui-kitten/components';
import { PromotionSlider } from './PromotionSlider';
import { WebData } from '@core/tea-utils';
import { Promotion } from './model';
import { match } from 'ts-pattern';

interface PromotionModalProps {
    promotions: WebData<Promotion[]>;
    isVisible: boolean;
    onClose: () => void;
    onParticipate: (promotion: Promotion) => void;
}

const CloseIcon = (props: any) => (
  <Icon {...props} name='close-outline' />
);

export const PromotionModal: React.FC<PromotionModalProps> = ({ promotions, isVisible, onClose, onParticipate }) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                
                <View style={styles.contentContainer}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                    >
                        <CloseIcon style={styles.icon} fill='#FFFFFF' />
                    </TouchableOpacity>

                    {match(promotions)
                        .with({ type: 'NotAsked' }, () => (
                            <View style={styles.messageContainer}>
                                <Text status="control">Cargando promociones...</Text>
                            </View>
                        ))
                        .with({ type: 'Loading' }, () => (
                            <View style={styles.messageContainer}>
                                <ActivityIndicator size="large" color="#FFFFFF" />
                            </View>
                        ))
                        .with({ type: 'Failure' }, ({ error }) => (
                            <View style={styles.messageContainer}>
                                <Text status="danger">Error al cargar promociones: {error.message}</Text>
                            </View>
                        ))
                        .with({ type: 'Success' }, ({ data }) => (
                            data.length > 0 ? (
                                <PromotionSlider 
                                    promotions={data} 
                                    onParticipate={onParticipate}
                                />
                            ) : (
                                <View style={styles.messageContainer}>
                                    <Text status="control">No hay promociones disponibles.</Text>
                                </View>
                            )
                        ))
                        .exhaustive()}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        width: '100%',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: -100, // Move it up from the slider
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    icon: {
        width: 28,
        height: 28,
    },
    messageContainer: {
        padding: 40,
        alignItems: 'center',
    },
});
