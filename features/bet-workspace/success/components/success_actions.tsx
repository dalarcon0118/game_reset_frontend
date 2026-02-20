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
                status='primary'
                accessoryLeft={(props: any) => (
                    <Share2 
                        size={20} 
                        color={props.style?.tintColor || '#FFFFFF'} 
                    />
                )}
            >
                Compartir Recibo
            </Button>

            <Button 
                onPress={onDone} 
                style={styles.doneButton}
                appearance='outline'
                status='basic'
                size='medium'
                accessoryLeft={(props: any) => (
                    <Home 
                        size={20} 
                        color={props.style?.tintColor || theme['text-basic-color']} 
                    />
                )}
            >
                Nueva Apuesta
            </Button>
        </>
    );
};

const styles = StyleSheet.create({
    shareButton: {
        width: '100%',
        marginTop: 40,
        marginBottom: 12,
        borderRadius: 12,
        shadowColor: '#3366FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    doneButton: {
        width: '100%',
        borderRadius: 12,
        marginBottom: 40,
    }
});
