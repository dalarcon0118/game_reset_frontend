import React from 'react';
import { StyleSheet } from 'react-native';
import { Button, useTheme } from '@ui-kitten/components';
import { Share2, Home } from 'lucide-react-native';

interface SuccessActionsProps {
    onShare: () => void;
    onDone: () => void;
}

export const SuccessActions: React.FC<SuccessActionsProps> = ({ onShare, onDone }) => {
    const theme = useTheme();

    return (
        <>
            <Button 
                onPress={onShare} 
                style={styles.shareButton}
                size='large'
                accessoryLeft={() => <Share2 size={20} color="#FFFFFF" />}
            >
                Compartir Voucher
            </Button>

            <Button 
                onPress={onDone} 
                style={styles.doneButton}
                appearance='ghost'
                status='basic'
                accessoryLeft={() => <Home size={20} color={theme['text-basic-color']} />}
            >
                Volver al Inicio
            </Button>
        </>
    );
};

const styles = StyleSheet.create({
    shareButton: {
        width: '100%',
        marginTop: 30,
        marginBottom: 10,
    },
    doneButton: {
        width: '100%',
    }
});
