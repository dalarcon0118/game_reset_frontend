import React, { useCallback } from 'react';
import { View, TouchableOpacity, FlatList, ListRenderItemInfo } from 'react-native';
import { match } from 'ts-pattern';
import { RemoteData } from '@core/tea-utils';
import { Label, DrawsListSkeleton } from '@/shared/components';
import { useDashboardStore } from '../../store';
import { REFRESH_CLICKED } from '../../core/msg';
import { drawsListStyles as styles } from '../../core/styles';
import DrawItem from './draw_item';

const DRAW_ITEM_HEIGHT = 160;

export const DrawsListView: React.FC = () => {
	const model = useDashboardStore((s) => s.model);
	const dispatch = useDashboardStore((s) => s.dispatch);

	const handleRefresh = useCallback(() => dispatch(REFRESH_CLICKED()), [dispatch]);

	const handleBetsListPress = useCallback((id: string, title: string, draw: any) => {
		dispatch({ type: 'BETS_LIST_CLICKED', drawId: id, title, drawType: draw.draw_type_details?.code });
	}, [dispatch]);

	const handleCreateBetPress = useCallback((id: string, title: string, draw: any) => {
		dispatch({ type: 'CREATE_BET_CLICKED', drawId: id, title, drawType: draw.draw_type_details?.code });
	}, [dispatch]);

	const renderNotAsked = () => (
		<DrawsListSkeleton loading={true} />
	);

	const renderLoading = () => (
		<DrawsListSkeleton loading={true} />
	);

	const renderError = ({ error }: { error: unknown }) => (
		<View style={styles.centerContainer}>
			<Label style={styles.errorText}>Error al cargar sorteos</Label>
			<TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
				<Label style={styles.retryText}>Reintentar</Label>
			</TouchableOpacity>
		</View>
	);

	const getItemLayout = useCallback((_: any, index: number) => ({
		length: DRAW_ITEM_HEIGHT,
		offset: DRAW_ITEM_HEIGHT * index,
		index,
	}), []);

	const keyExtractor = useCallback((item: any) => String(item.id), []);

	const renderItem = useCallback(({ item: draw }: ListRenderItemInfo<any>) => (
		<DrawItem
			draw={draw}
			onBetsListPress={handleBetsListPress}
			onCreateBetPress={handleCreateBetPress}
			showBalance={model.showBalance}
		/>
	), [handleBetsListPress, handleCreateBetPress, model.showBalance]);

	const renderSuccess = () => {
		const filteredDraws = (model.filteredDraws || []).filter((draw) => draw && draw.id != null);
		if (filteredDraws.length === 0) {
			return (
				<View style={styles.centerContainer}>
					<Label style={styles.emptyText}>No hay sorteos disponibles</Label>
				</View>
			);
		}
		return (
			<FlatList
				data={filteredDraws}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				getItemLayout={getItemLayout}
				scrollEnabled={false}
			/>
		);
	};

	return match(model.draws || RemoteData.notAsked())
		.with({ type: 'NotAsked' }, renderNotAsked)
		.with({ type: 'Loading' }, renderLoading)
		.with({ type: 'Failure' }, renderError)
		.with({ type: 'Success' }, renderSuccess)
		.exhaustive();
};