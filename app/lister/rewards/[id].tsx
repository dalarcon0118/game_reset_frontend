import RewardsScreen from '@/features/listero/bets/views/rewards';
import { useLocalSearchParams } from 'expo-router';

export default function BetsListScreen() {
  const { id } = useLocalSearchParams();
  return <RewardsScreen drawId={id as string} />;
}
