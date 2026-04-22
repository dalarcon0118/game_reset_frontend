import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { Text } from '@ui-kitten/components';
import { Trophy, Star, Award } from 'lucide-react-native';
import Colors from '@/constants/colors';

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
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const getPrizeColor = (type: PrizeTagType) => {
        const defaultStyle = { backgroundColor: '#F0F0F0', color: '#666666' };
        
        if (type === 'secondary' || type === 'tertiary') {
            return colorScheme === 'dark' 
                ? { backgroundColor: theme.backgroundSecondary, color: theme.text }
                : { backgroundColor: '#E0E0E0', color: '#000000' };
        }
        
        if (type === 'pool') return { backgroundColor: '#FFD700', color: '#000000' };
        if (type === 'fixed') return { backgroundColor: '#28A745', color: '#FFFFFF' };
        
        return defaultStyle;
    };

    const renderIcon = () => {
        const iconColor = colorScheme === 'dark' ? theme.text : undefined;
        switch (icon) {
            case 'trophy': return <Trophy size={28} color={iconColor || '#D4AF37'} />; 
            case 'star': return <Star size={28} color={iconColor || '#FFD700'} fill={iconColor || '#FFD700'} />; 
            case 'award': return <Award size={28} color={theme.primary} />;
        }
    };

    return (
        <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.content}>
                <View style={styles.leftColumn}>
                    <View style={styles.headerRow}>
                        <View style={[styles.iconWrapper, { backgroundColor: theme.backgroundSecondary }]}>
                            {renderIcon()}
                        </View>
                        <Text category="h6" style={[styles.titleText, { color: theme.text }]}>{title}</Text>
                    </View>
                    
                    <View style={styles.tagsContainer}>
                        {tags.map((tag, index) => {
                            const style = getPrizeColor(tag.type);
                            const textColor = style.color || style.backgroundColor; // fallback
                            return (
                                <View key={index} style={[styles.tag, { backgroundColor: style.backgroundColor }]}>
                                    <Text style={[styles.tagText, { color: textColor }]}>{tag.text}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.rightColumn}>
                    <Text category="h4" style={[styles.multiplierText, { color: theme.text }]}>{multiplier}</Text>
                </View>
            </View>
            
            {description && (
                <View style={[styles.description, { borderTopColor: theme.border }]}>
                    <Text category="c1" style={[styles.descriptionText, { color: theme.textSecondary }]}>{description}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftColumn: {
        flex: 1,
    },
    rightColumn: {
        alignItems: 'flex-end',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconWrapper: {
        marginRight: 12,
        width: 44,
        height: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleText: {
        fontWeight: '800',
        fontSize: 18,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tagText: {
        fontWeight: '700',
        fontSize: 11,
    },
    multiplierText: {
        fontWeight: '900',
        fontSize: 24,
    },
    description: {
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    descriptionText: {
        fontSize: 14,
    },
});