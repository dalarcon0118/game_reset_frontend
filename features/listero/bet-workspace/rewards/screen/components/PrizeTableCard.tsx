import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, useTheme } from '@ui-kitten/components';
import { Trophy, Star, Award } from 'lucide-react-native';

export type PrizeTagType = 'pool' | 'fixed' | 'secondary' | 'tertiary';

export interface PrizeTag {
    text: string;
    type: PrizeTagType;
}

export interface PrizeTableCardProps {
    title: string;
    multiplier: string;
    tags: PrizeTag[];
    icon: 'trophy' | 'star' | 'award';
    description?: string;
}

export const PrizeTableCard: React.FC<PrizeTableCardProps> = ({ title, multiplier, tags, icon, description }) => {
    const theme = useTheme();

    const getTagStyle = (type: PrizeTagType) => {
        switch (type) {
            case 'pool': return { backgroundColor: '#FFD700', color: '#000000' }; // Pool Banco (Yellow)
            case 'fixed': return { backgroundColor: '#28A745', color: '#FFFFFF' }; // [Fijo] (Green)
            case 'secondary': return { backgroundColor: '#E0E0E0', color: '#000000' }; // Secondary (Gray)
            case 'tertiary': return { backgroundColor: '#E0E0E0', color: '#000000' }; // Tertiary (Gray)
            default: return { backgroundColor: '#F0F0F0', color: '#666666' };
        }
    };

    const renderIcon = () => {
        switch (icon) {
            case 'trophy': return <Trophy size={28} color="#D4AF37" />; 
            case 'star': return <Star size={28} color="#FFD700" fill="#FFD700" />; 
            case 'award': return <Award size={28} color={theme['color-primary-500']} />;
        }
    };

    return (
        <View style={styles.cardContainer}>
            <View style={styles.cardContent}>
                <View style={styles.leftColumn}>
                    <View style={styles.headerRow}>
                        <View style={styles.iconWrapper}>
                            {renderIcon()}
                        </View>
                        <Text category="h6" style={styles.titleText}>{title}</Text>
                    </View>
                    
                    <View style={styles.tagsContainer}>
                        {tags.map((tag, index) => {
                            const style = getTagStyle(tag.type);
                            return (
                                <View key={index} style={[styles.tagPill, { backgroundColor: style.backgroundColor }]}>
                                    <Text category="c2" style={[styles.tagLabelText, { color: style.color }]}>{tag.text}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.rightColumn}>
                    <Text category="h4" style={styles.multiplierText}>{multiplier}</Text>
                </View>
            </View>
            
            {description && (
                <View style={styles.descriptionContainer}>
                    <Text category="c1" appearance="hint" style={styles.descriptionText}>{description}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 24,
        // Elevation for Android
        elevation: 8,
        // Shadows for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftColumn: {
        flex: 1,
        justifyContent: 'center',
    },
    rightColumn: {
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingLeft: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    iconWrapper: {
        marginRight: 12,
        width: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleText: {
        fontWeight: '800',
        fontSize: 24,
        color: '#000000',
    },
    tagsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        flexWrap: 'wrap',
    },
    tagPill: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tagLabelText: {
        fontWeight: '800',
        fontSize: 13,
    },
    multiplierText: {
        fontWeight: '800',
        fontSize: 32,
        color: '#000000',
        letterSpacing: -0.5,
    },
    descriptionContainer: {
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F5F5F5',
    },
    descriptionText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#666',
    },
});
