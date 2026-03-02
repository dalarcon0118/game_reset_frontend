import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import Colors from '@/constants/colors';

export const NotAskedView = () => (
    <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color="#999" />
        <Text style={[styles.loadingText, { color: '#666' }]}>Iniciando...</Text>
    </View>
);

export const LoadingView = () => {
    const colorScheme = (useColorScheme() ?? 'light') as keyof typeof Colors;
    return (
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
            <Text style={styles.loadingText}>Cargando lista...</Text>
        </View>
    );
};

export const FailureView = ({ error }: { error: string }) => (
    <View style={styles.centerContainer}>
        <Text style={{ color: 'red' }}>Error: {error}</Text>
    </View>
);

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
    },
});
