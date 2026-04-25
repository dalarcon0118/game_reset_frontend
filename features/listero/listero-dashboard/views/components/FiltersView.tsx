import React, { useCallback } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { Label } from '@/shared/components';
import { useDashboardStore } from '../../store';
import { SELECT_FILTER } from '../../core/msg';
import { filtersStyles as styles, DRAW_FILTER_OPTIONS } from '../../core/styles';

export const FiltersView: React.FC = () => {
	const model = useDashboardStore((s) => s.model);
	const dispatch = useDashboardStore((s) => s.dispatch);

	const handleFilterPress = useCallback((value: string) => {
		dispatch(SELECT_FILTER(value as any));
	}, [dispatch]);

	return (
		<View style={styles.wrapper}>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.filtersContainer}
			>
				{DRAW_FILTER_OPTIONS.map((option) => (
					<TouchableOpacity
						key={option.value}
						onPress={() => handleFilterPress(option.value)}
						style={[
							styles.filterTab,
							model.appliedFilter === option.value && styles.activeFilterTab
						]}
					>
						<Label
							style={[
								styles.filterLabel,
								model.appliedFilter === option.value && styles.activeFilterLabel
							]}
						>
							{option.label}
						</Label>
					</TouchableOpacity>
				))}
			</ScrollView>
		</View>
	);
};