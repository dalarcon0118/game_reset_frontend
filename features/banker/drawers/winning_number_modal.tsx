import React, { useState, useCallback } from 'react';
import { 
    View, 
    StyleSheet, 
    Modal, 
    TextInput, 
    Pressable, 
    Platform,
    KeyboardAvoidingView
} from 'react-native';
import { Text, Button } from '@ui-kitten/components';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/shared/hooks/use_theme';
import { X, Check } from 'lucide-react-native';

interface WinningNumberValidationConfig {
    regex?: string;
    error_message?: string;
    min_digits?: number;
    max_digits?: number;
    exact_digits?: number;
    placeholder?: string;
}

interface DrawTypeExtraData {
    winning_number_validation?: WinningNumberValidationConfig;
    [key: string]: unknown;
}

interface WinningNumberModalProps {
    visible: boolean;
    drawId: number;
    drawName: string;
    extraData?: DrawTypeExtraData | null;
    onClose: () => void;
    onSubmit: (winningNumber: string) => void;
}

export const WinningNumberModal: React.FC<WinningNumberModalProps> = ({
    visible,
    drawId,
    drawName,
    extraData,
    onClose,
    onSubmit
}) => {
    const { colors, spacing } = useTheme();
    const [winningNumber, setWinningNumber] = useState('');
    const [error, setError] = useState<string | null>(null);
    const winningNumberValidation = extraData?.winning_number_validation;

    const validateWinningNumber = useCallback((value: string): boolean => {
        const trimmedValue = value.trim();
        if (!trimmedValue) {
            setError('El número ganador es requerido');
            return false;
        }

        const fallbackRegex = /^[\d\s]+$/;
        let regex = fallbackRegex;
        if (winningNumberValidation?.regex) {
            try {
                regex = new RegExp(winningNumberValidation.regex);
            } catch (_error) {
                regex = fallbackRegex;
            }
        }
        if (!regex.test(trimmedValue)) {
            setError(winningNumberValidation?.error_message || 'Formato inválido. Use solo números y espacios (ej: "284 39 19")');
            return false;
        }

        const digitsOnly = value.replace(/\s/g, '');
        if (digitsOnly.length === 0) {
            setError('Debe ingresar al menos un número');
            return false;
        }

        if (typeof winningNumberValidation?.exact_digits === 'number' && digitsOnly.length !== winningNumberValidation.exact_digits) {
            setError(`Debe ingresar exactamente ${winningNumberValidation.exact_digits} dígitos`);
            return false;
        }

        if (typeof winningNumberValidation?.min_digits === 'number' && digitsOnly.length < winningNumberValidation.min_digits) {
            setError(`Debe ingresar al menos ${winningNumberValidation.min_digits} dígitos`);
            return false;
        }

        if (typeof winningNumberValidation?.max_digits === 'number' && digitsOnly.length > winningNumberValidation.max_digits) {
            setError(`Debe ingresar como máximo ${winningNumberValidation.max_digits} dígitos`);
            return false;
        }

        setError(null);
        return true;
    }, [winningNumberValidation]);

    const handleSubmit = useCallback(() => {
        if (!validateWinningNumber(winningNumber)) {
            if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
            return;
        }
        
        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        onSubmit(winningNumber.trim());
        setWinningNumber('');
        setError(null);
    }, [winningNumber, validateWinningNumber, onSubmit]);

    const handleClose = useCallback(() => {
        setWinningNumber('');
        setError(null);
        onClose();
    }, [onClose]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <Pressable 
                    style={styles.overlay}
                    onPress={handleClose}
                >
                    <Pressable 
                        style={[
                            styles.modalContainer,
                            { 
                                backgroundColor: colors.surface,
                                borderRadius: 16,
                                padding: spacing.lg
                            }
                        ]}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <Text 
                                category="h6"
                                style={{ color: colors.text }}
                            >
                                Agregar Número Ganador
                            </Text>
                            <Pressable
                                onPress={handleClose}
                                style={({ pressed }) => [
                                    styles.closeButton,
                                    { opacity: pressed ? 0.5 : 1 }
                                ]}
                                accessibilityRole="button"
                                accessibilityLabel="Cerrar modal"
                            >
                                <X size={24} color={colors.textSecondary} />
                            </Pressable>
                        </View>

                        {/* Draw Info */}
                        <View style={[styles.drawInfo, { marginTop: spacing.md }]}>
                            <Text 
                                category="s1"
                                style={{ color: colors.textSecondary }}
                            >
                                Sorteo:
                            </Text>
                            <Text 
                                category="s1"
                                style={{ color: colors.text, fontWeight: '600' }}
                            >
                                {drawName}
                            </Text>
                        </View>

                        {/* Input */}
                        <View style={[styles.inputContainer, { marginTop: spacing.lg }]}>
                            <Text 
                                category="label"
                                style={{ color: colors.textSecondary, marginBottom: spacing.xs }}
                            >
                                Número Ganador
                            </Text>
                            <TextInput
                                value={winningNumber}
                                onChangeText={(text) => {
                                    setWinningNumber(text);
                                    if (error) validateWinningNumber(text);
                                }}
                                placeholder={winningNumberValidation?.placeholder || 'Ej: 284 39 19'}
                                placeholderTextColor={colors.textSecondary}
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: colors.background,
                                        color: colors.text,
                                        borderColor: error ? colors.error : colors.border,
                                        borderWidth: 1,
                                        borderRadius: 8,
                                        padding: spacing.md,
                                        fontSize: 16
                                    }
                                ]}
                                keyboardType="numeric"
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoFocus
                            />
                            {error && (
                                <Text 
                                    category="c1"
                                    style={{ color: colors.error, marginTop: spacing.xs }}
                                >
                                    {error}
                                </Text>
                            )}
                        </View>

                        {/* Actions */}
                        <View style={[styles.actions, { marginTop: spacing.lg }]}>
                            <Button
                                appearance="outline"
                                status="basic"
                                onPress={handleClose}
                                style={{ flex: 1, marginRight: spacing.sm }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                appearance="filled"
                                status="primary"
                                onPress={handleSubmit}
                                style={{ flex: 1, marginLeft: spacing.sm }}
                                accessoryLeft={<Check size={20} color="white" />}
                            >
                                Guardar
                            </Button>
                        </View>
                    </Pressable>
                </Pressable>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    keyboardAvoidingView: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    closeButton: {
        padding: 4,
    },
    drawInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputContainer: {
        width: '100%',
    },
    input: {
        width: '100%',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
});
