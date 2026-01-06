import BetsList from '@/features/listero/bets/views/list/index';
import { useLocalSearchParams } from 'expo-router';

export default function BetsListScreen() {
  const { id,title } = useLocalSearchParams();
  return <BetsList drawId={id as string} title={title}/>;
}