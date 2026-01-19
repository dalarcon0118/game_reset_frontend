import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Text } from '@ui-kitten/components';
import { useLocalSearchParams } from 'expo-router';
import { getGameComponent, renderGameComponent } from '@/features/listero/games/registry';
import { DrawService } from '@/shared/services/Draw';
import Colors from '@/constants/Colors';

export default function ListerBetsScreen() {
  const { id, title } = useLocalSearchParams();
  const [drawData, setDrawData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchDrawData = async () => {
      try {
        setLoading(true);
        const draw = await DrawService.getOne(id as string);
        if (draw) {
          setDrawData(draw);
        } else {
          setError('Draw not found');
        }
      } catch (err) {
        console.error('Error fetching draw:', err);
        setError('Failed to load draw information');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDrawData();
    }
  }, [id]);

  const renderContent = () => {
    if (loading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: 'red', textAlign: 'center' }}>{error}</Text>
        </View>
      );
    }

    if (!drawData) {
      return null;
    }

    const drawTypeCode = drawData.draw_type_details?.code;
    if (!drawTypeCode) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ textAlign: 'center' }}>Draw type information not available</Text>
        </View>
      );
    }

    const GameComponent = getGameComponent(drawTypeCode);
    if (!GameComponent) {
      return renderGameComponent(drawTypeCode, {
        drawId: id as string,
        title: title as string
      });
    }

    return (
      <GameComponent
        drawId={id as string}
        title={title as string}
      />
    );
  };

  return renderContent();
}
