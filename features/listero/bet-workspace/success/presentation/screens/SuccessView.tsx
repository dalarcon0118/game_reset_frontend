import React, { useRef } from 'react';
import { StyleSheet, ScrollView, useColorScheme, useWindowDimensions } from 'react-native';
import { Layout } from '@ui-kitten/components';
import { Stack } from 'expo-router';
import ViewShot from 'react-native-view-shot';
import Colors from '@/constants/colors';
import { ScreenContainer } from '@/shared/components';
import { SuccessHeader } from '../components/success_header';
import { SuccessVoucher } from '../components/success_voucher';
import { SuccessActions } from '../components/success_actions';
import { VoucherData } from '../../core/domain/success.types';
import { WebData } from '@core/tea-utils';

interface SuccessViewProps {
    data: VoucherData;
    actions: {
        onShare: (ref: React.RefObject<ViewShot>) => void;
        onDone: () => void;
    };
    viewShotRef?: React.RefObject<ViewShot>;
    sharingStatus?: WebData<boolean>;
}

export const SuccessView: React.FC<SuccessViewProps> = ({ 
    data, 
    actions, 
    viewShotRef: externalViewShotRef,
    sharingStatus
}) => {
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
    const { width } = useWindowDimensions();
    const internalViewShotRef = useRef<ViewShot>(null);
    const viewShotRef = externalViewShotRef || internalViewShotRef;

    const isSharing = sharingStatus?.type === 'Loading';

    return (
        <ScreenContainer
            edges={['top', 'left', 'right', 'bottom']}
            backgroundColor={Colors[colorScheme].background}
        >
            <Stack.Screen options={{ title: 'Voucher' }} />
            <Layout style={styles.container} level='1'>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <ViewShot 
                        ref={viewShotRef} 
                        options={{ format: 'png', quality: 1.0, width: width - 40 }}
                        style={[
                            styles.viewShotContainer, 
                            { backgroundColor: '#F7F9FC', padding: 20, width: width - 40 }
                        ]}
                    >
                        <SuccessHeader receiptCode={data.receiptCode} />
                        <SuccessVoucher 
                            drawId={data.drawId} 
                            receiptCode={data.receiptCode}
                            bets={data.bets} 
                            totalAmount={data.totalAmount} 
                            metadata={data.metadata}
                            isBolita={data.isBolita}
                            groupedBets={data.groupedBets}
                        />
                    </ViewShot>

                    <SuccessActions 
                        onShare={() => actions.onShare(viewShotRef)} 
                        onDone={actions.onDone} 
                        isSharing={isSharing}
                    />
                </ScrollView>
            </Layout>
        </ScreenContainer>
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
