import BetsList from '@/features/listero/views/bets/list/index';
import { useLocalSearchParams } from 'expo-router';

export default function BetsListScreen() {
  const { id } = useLocalSearchParams();
  return <BetsList drawId={id as string} />;
}