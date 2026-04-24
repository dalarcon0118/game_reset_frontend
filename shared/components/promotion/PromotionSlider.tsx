import React, { useRef, useState } from 'react';
import { FlatList, View, StyleSheet, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { PromotionCard } from './PromotionCard';
import { Promotion } from './model';

interface PromotionSliderProps {
    promotions: Promotion[];
    onParticipate: (promotion: Promotion) => void;
}

export const PromotionSlider: React.FC<PromotionSliderProps> = ({ promotions, onParticipate }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = event.nativeEvent.contentOffset.x / slideSize;
        const roundIndex = Math.round(index);
        setActiveIndex(roundIndex);
    };

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={promotions}
                renderItem={({ item }) => (
                    <PromotionCard 
                        promotion={item} 
                        onParticipate={onParticipate}
                    />
                )}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                contentContainerStyle={styles.flatListContent}
            />
            
            {promotions.length > 1 && (
                <View style={styles.pagination}>
                    {promotions.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.paginationDot,
                                index === activeIndex ? styles.paginationDotActive : null,
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
    },
    flatListContent: {
        alignItems: 'center',
    },
    pagination: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 8,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    paginationDotActive: {
        backgroundColor: '#FFFFFF',
        width: 24,
    },
});
