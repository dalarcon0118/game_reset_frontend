import { BetsListScreen } from '@/features/listero/bets/screens/bets_list_screen';
import { useLocalSearchParams } from 'expo-router';

export default function BetsListPage() {
  const { id, title } = useLocalSearchParams();
  return <BetsListScreen drawId={id as string} title={title as string} />;
}
