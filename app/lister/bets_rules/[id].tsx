import { RulesScreen } from '@/features/listero/bets/screens/rules_screen';
import { useLocalSearchParams } from 'expo-router';

export default function BetsRulesScreen() {
  const { id } = useLocalSearchParams();
  return <RulesScreen drawId={id as string} />;
}
