import React, { useRef } from 'react';
import { Stack } from 'expo-router';
import { Layout } from '@ui-kitten/components';
import { StyleSheet, ScrollView, SafeAreaView, useColorScheme, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import Colors from '@/constants/colors';

import { useSuccess } from '../use_success';
import { SuccessHeader } from '../components/success_header';
import { SuccessVoucher } from '../components/success_voucher';
import { SuccessActions } from '../components/success_actions';

const SuccessScreen = () => {
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
    const viewShotRef = useRef<ViewShot>(null);
    
    const { 
        receiptCode, 
        bets, 
        totalAmount, 
        drawId, 
        metadata,
        isBolita,
        groupedBets,
        handleShare, 
        handleBack 
    } = useSuccess();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors[colorScheme].background }}>
            <Stack.Screen options={{ title: 'Voucher' }} />
            <Layout style={styles.container} level='1'>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <ViewShot 
                        ref={viewShotRef} 
                        options={{ format: 'png', quality: 0.9 }}
                        style={styles.viewShotContainer}
                    >
                        <SuccessHeader receiptCode={receiptCode} />
                        <SuccessVoucher 
                            drawId={drawId} 
                            receiptCode={receiptCode}
                            bets={bets as any} 
                            totalAmount={totalAmount} 
                            metadata={metadata}
                            isBolita={isBolita}
                            groupedBets={groupedBets}
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
        padding: 10,
        alignItems: 'center',
        flexGrow: 1,
    },
    viewShotContainer: {
        width: '100%',
       
    }
});

export default SuccessScreen;
/* //  padding: 16,
      //  backgroundColor: '#FFFFFF',
        borderRadius: 16,
         shadowColor: '#000',
       //  shadowOffset: { width: 0, height: 4 },
       // shadowOpacity: 0.1,
       // shadowRadius: 12,
        elevation: 5,*/