import { useCallback } from 'react';
import { Alert } from 'react-native';

interface UseConfirmationProps {
    title?: string;
    message: string;
    onConfirm: () => Promise<void>;
    onSuccess?: () => void;
    successMessage?: string;
    errorMessage?: string;
}

export const useConfirmation = () => {
    const confirmAction = useCallback(({
        title = "Confirmar acción",
        message,
        onConfirm,
        onSuccess,
        successMessage,
        errorMessage = "Ocurrió un error al realizar la acción"
    }: UseConfirmationProps) => {
        Alert.alert(
            title,
            message,
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Confirmar",
                    onPress: async () => {
                        try {
                            await onConfirm();

                            if (successMessage) {
                                Alert.alert(
                                    "¡Éxito!",
                                    successMessage,
                                    [{ text: "OK", onPress: onSuccess }]
                                );
                            } else {
                                onSuccess?.();
                            }
                        } catch (err) {
                            console.error("Confirmation action error:", err);
                            Alert.alert("Error", errorMessage);
                        }
                    }
                }
            ]
        );
    }, []);

    return { confirmAction };
};
