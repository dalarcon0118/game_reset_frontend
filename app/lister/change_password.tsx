import { ChangePasswordScreen } from '@/features/listero/listero-dashboard/profile';
import { Stack } from 'expo-router';

export default function ChangePasswordRoute() {
    return (
        <>
            <Stack.Screen 
                options={{ 
                    title: 'Cambiar PIN',
                    headerBackTitle: 'Perfil',
                    headerShadowVisible: false,
                }} 
            />
            <ChangePasswordScreen />
        </>
    );
}
