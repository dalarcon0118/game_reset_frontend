import React, { useRef } from 'react';
import { Stack } from 'expo-router';
import { Layout } from '@ui-kitten/components';
import { StyleSheet, ScrollView, SafeAreaView, useColorScheme, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import Colors from '@/constants/Colors';

import { useSuccess } from '../useSuccess';
import { SuccessHeader } from '../components/SuccessHeader';
import { SuccessVoucher } from '../components/SuccessVoucher';
import { SuccessActions } from '../components/SuccessActions';

const SuccessScreen = () => {
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
    const viewShotRef = useRef<ViewShot>(null);
    
    const { 
        receiptCode, 
        bets, 
        totalAmount, 
        drawId, 
        handleShare, 
        handleBack 
    } = useSuccess();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors[colorScheme].background }}>
            <Stack.Screen options={{ title: 'Voucher' }} />
            <Layout style={styles.container} level='1'>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <SuccessHeader receiptCode={receiptCode} />

                    <ViewShot 
                        ref={viewShotRef} 
                        options={{ format: 'png', quality: 0.9 }}
                        style={styles.viewShotContainer}
                    >
                        <SuccessVoucher 
                            drawId={drawId} 
                            receiptCode={receiptCode}
                            bets={bets as any} 
                            totalAmount={totalAmount} 
                        />
                    </ViewShot>

                    <SuccessActions 
                        onShare={() => handleShare(viewShotRef)} 
                        onDone={handleBack} 
                    />
                </ScrollView>
            </Layout>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        alignItems: 'center',
    },
    viewShotContainer: {
        width: '100%',
        padding: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
    }
});

export default SuccessScreen;
