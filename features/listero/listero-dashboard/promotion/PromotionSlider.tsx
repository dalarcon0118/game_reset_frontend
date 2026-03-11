import React from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { PromotionCard } from './PromotionCard';
import { Promotion } from './model';

interface PromotionSliderProps {
    promotions: Promotion[];
}

export const PromotionSlider: React.FC<PromotionSliderProps> = ({ promotions }) => {
    return (
        <View style={styles.container}>
            <FlatList
                data={promotions}
                renderItem={({ item }) => <PromotionCard promotion={item} />}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={200 + 20} // Card width + marginHorizontal * 2
                decelerationRate="fast"
                contentContainerStyle={styles.flatListContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 250, // Adjust height as needed for your cards
    },
    flatListContent: {
        paddingHorizontal: 10,
    },
});
