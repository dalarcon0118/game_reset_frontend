import React from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Button } from '@ui-kitten/components';
import { Promotion } from './model';
import { LinearGradient } from 'expo-linear-gradient';

interface PromotionCardProps {
    promotion: Promotion;
    onParticipate: (promotion: Promotion) => void;
}

const { width, height } = Dimensions.get('window');

export const PromotionCard: React.FC<PromotionCardProps> = ({ promotion, onParticipate }) => {
    const config = promotion.style_config || {};
    const gradientColors = config.gradient || ['#4c669f', '#3b5998', '#192f6a'];
    const textColor = config.text || '#FFFFFF';

    return (
        <View style={styles.cardContainer}>
            <LinearGradient
                colors={gradientColors as any}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.content}>
                    <Text category="h1" style={[styles.title, { color: textColor }]}>
                        {promotion.title}
                    </Text>
                    
                    {promotion.subtitle ? (
                        <Text category="h6" style={[styles.subtitle, { color: textColor }]}>
                            {promotion.subtitle}
                        </Text>
                    ) : null}

                    <Text style={[styles.description, { color: textColor }]}>
                        {promotion.description}
                    </Text>

                    <Button 
                        style={styles.button}
                        status="control"
                        appearance="filled"
                        onPress={() => onParticipate(promotion)}
                    >
                        Participar Ahora
                    </Button>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        width: width * 0.85,
        height: height * 0.6,
        marginHorizontal: width * 0.075,
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    gradient: {
        flex: 1,
        padding: 30,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        textAlign: 'center',
        fontWeight: '900',
        fontSize: 32,
        marginBottom: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 10,
    },
    subtitle: {
        textAlign: 'center',
        fontWeight: '600',
        marginBottom: 15,
        opacity: 0.9,
    },
    description: {
        textAlign: 'center',
        fontSize: 18,
        lineHeight: 26,
        marginBottom: 40,
        opacity: 0.85,
    },
    button: {
        width: '100%',
        borderRadius: 12,
        height: 56,
    }
});
