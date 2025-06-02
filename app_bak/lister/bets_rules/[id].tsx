import RulesScreen from '@/features/listero/views/bets/rules';
import { useLocalSearchParams } from 'expo-router';

export default function BetsListScreen() {
  const { id } = useLocalSearchParams();
  return <RulesScreen drawId={id as string} />;
}
