import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Input, Button, Icon, IconProps, Spinner } from '@ui-kitten/components';
import { useProfileStore, selectProfileModel, selectDispatch } from '../store';
import { ProfileMsgType } from '../profile.types';
import { Eye, EyeOff, Lock } from 'lucide-react-native';

const LockIcon = (props: IconProps) => <Lock {...props} size={20} color={props.fill as string} />;

export const ChangePasswordScreen: React.FC = () => {
    const model = useProfileStore(selectProfileModel);
    const dispatch = useProfileStore(selectDispatch);
    const [secureTextEntry, setSecureTextEntry] = useState(true);

    const { newPin, confirmPin, status, error } = model.changePasswordSession;
    const isSubmitting = status === 'submitting';

    const toggleSecureEntry = () => {
        setSecureTextEntry(!secureTextEntry);
    };

    const renderIcon = (props: any) => (
        <View onTouchEnd={toggleSecureEntry}>
            {secureTextEntry ? <EyeOff {...props} size={20} /> : <Eye {...props} size={20} />}
        </View>
    );

    const handleNewPinChange = (nextValue: string) => {
        dispatch({ type: ProfileMsgType.NEW_PIN_CHANGED, pin: nextValue });
    };

    const handleConfirmPinChange = (nextValue: string) => {
        dispatch({ type: ProfileMsgType.CONFIRM_PIN_CHANGED, pin: nextValue });
    };

    const handleSubmit = () => {
        dispatch({ type: ProfileMsgType.SUBMIT_CHANGE_PASSWORD });
    };

    const isPinMatch = newPin === confirmPin;
    const isPinValid = newPin.length === 6;
    const canSubmit = isPinValid && isPinMatch && !isSubmitting;

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Text category="h5" style={styles.title}>Actualizar PIN</Text>
                        <Text appearance="hint" style={styles.subtitle}>
                            Ingresa tu nuevo PIN de seguridad de 6 dígitos.
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <Input
                            value={newPin}
                            label="NUEVO PIN"
                            placeholder="******"
                            accessoryRight={renderIcon}
                            secureTextEntry={secureTextEntry}
                            onChangeText={handleNewPinChange}
                            keyboardType="numeric"
                            maxLength={6}
                            disabled={isSubmitting}
                            status={newPin.length > 0 && !isPinValid ? 'danger' : 'basic'}
                            caption={newPin.length > 0 && !isPinValid ? "El PIN debe tener 6 dígitos" : ""}
                        />

                        <Input
                            value={confirmPin}
                            label="CONFIRMAR PIN"
                            placeholder="******"
                            secureTextEntry={secureTextEntry}
                            onChangeText={handleConfirmPinChange}
                            keyboardType="numeric"
                            maxLength={6}
                            disabled={isSubmitting}
                            style={styles.input}
                            status={confirmPin.length > 0 && !isPinMatch ? 'danger' : 'basic'}
                            caption={confirmPin.length > 0 && !isPinMatch ? "Los PINs no coinciden" : ""}
                        />

                        {error && (
                            <Text status="danger" style={styles.errorText}>
                                {error}
                            </Text>
                        )}

                        <Button
                            style={styles.submitButton}
                            onPress={handleSubmit}
                            disabled={!canSubmit}
                            accessoryLeft={isSubmitting ? () => <Spinner size="small" status="control" /> : undefined}
                        >
                            {isSubmitting ? 'ACTUALIZANDO...' : 'CAMBIAR PIN'}
                        </Button>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FC',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    header: {
        marginBottom: 32,
        alignItems: 'center',
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        textAlign: 'center',
    },
    form: {
        gap: 16,
    },
    input: {
        marginTop: 8,
    },
    errorText: {
        textAlign: 'center',
        marginTop: 8,
    },
    submitButton: {
        marginTop: 24,
        borderRadius: 12,
        height: 50,
    },
});
