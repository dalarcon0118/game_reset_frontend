import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { Promotion } from './model';

interface PromotionCardProps {
    promotion: Promotion;
}

const { width } = Dimensions.get('window');

export const PromotionCard: React.FC<PromotionCardProps> = ({ promotion }) => {
    return (
        <View style={styles.card}>
            <Image source={{ uri: promotion.image_url }} style={styles.image} />
            <View style={styles.content}>
                <Text style={styles.title}>{promotion.title}</Text>
                {promotion.description ? (
                    <Text style={styles.description}>{promotion.description}</Text>
                ) : null}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: width * 0.8, // 80% of screen width
        backgroundColor: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
        marginHorizontal: 10,
        elevation: 3, // Android shadow
        shadowColor: '#000', // iOS shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    image: {
        width: '100%',
        height: 150,
        resizeMode: 'cover',
    },
    content: {
        padding: 15,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    description: {
        fontSize: 14,
        color: '#666',
    },
});
