import { RewardsScreen } from '@/features/listero/bets/screens/rewards_screen';
import { useLocalSearchParams } from 'expo-router';

export default function RewardsPage() {
  const { id } = useLocalSearchParams();
  return <RewardsScreen drawId={id as string} />;
}
