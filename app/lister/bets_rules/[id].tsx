import { RulesScreen } from '@/features/listero/bets/screens/RulesScreen';
import { useLocalSearchParams } from 'expo-router';

export default function BetsRulesScreen() {
  const { id } = useLocalSearchParams();
  return <RulesScreen drawId={id as string} />;
}
