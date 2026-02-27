import React, { useRef, useState, useEffect } from 'react';
import { useVoucher } from '../hooks/use_voucher';
import { SuccessView } from './SuccessView';
import { ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';
const SuccessScreen = () => {
    const viewShotRef = useRef<any>(null);
    
    const { 
        data,
        handleShare, 
        handleBack,
        isLoading: repositoryLoading,
        sharingStatus
    } = useVoucher();

    const [timedOut, setTimedOut] = useState(false);

    // Track loading state - ensure we don't blink too fast
    useEffect(() => {
        const timer = setTimeout(() => {
            setTimedOut(true);
        }, 800); // Wait 0.8 seconds for stability
        return () => clearTimeout(timer);
    }, []);

    const isLoading = repositoryLoading || !timedOut;

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3366FF" />
                <Text style={{ marginTop: 16 }}>Cargando comprobante...</Text>
            </View>
        );
    }

    // Even if data is null, try to show something or go back
    if (!data) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#FF3D71' }}>
                    Voucher no disponible
                </Text>
                <Text style={{ textAlign: 'center', marginBottom: 24, color: '#8F9BB3' }}>
                    No se encontró la apuesta con el código solicitado. Verifica tu conexión o intenta de nuevo en unos momentos.
                </Text>
                <TouchableOpacity onPress={handleBack}>
                    <Text style={{ 
                        color: '#3366FF', 
                        fontWeight: '600',
                        fontSize: 16,
                        padding: 12,
                        backgroundColor: '#F7F9FC',
                        borderRadius: 8
                    }}>
                        Volver al inicio
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SuccessView 
            data={data}
            actions={{
                onShare: handleShare,
                onDone: handleBack
            }}
            viewShotRef={viewShotRef}
            sharingStatus={sharingStatus}
        />
    );
};

export default SuccessScreen;
