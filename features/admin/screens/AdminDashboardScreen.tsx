// Admin Dashboard Screen - Main entry point for admin functionality
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function AdminDashboardScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Admin Dashboard</Text>
            <Text style={styles.subtitle}>Seed Data Management System</Text>
            <Text style={styles.description}>
                This dashboard will allow you to manage all seed data for the lottery system,
                including roles, organizational structures, users, draw configurations, rules, and draws.
            </Text>
            <Text style={styles.note}>
                Features are being implemented following the TEA architecture pattern.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    subtitle: {
        fontSize: 18,
        marginBottom: 20,
        color: '#666',
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: '#666',
        lineHeight: 24,
    },
    note: {
        fontSize: 14,
        fontStyle: 'italic',
        color: '#999',
        textAlign: 'center',
    },
});
