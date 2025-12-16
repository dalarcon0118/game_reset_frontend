import { AnnotationTypes } from '@/constants/Bet';

export function canProcessBetInput(annotationType: string | null): boolean {
  return annotationType === AnnotationTypes.Bet;
}

export function canOpenAmountDrawer(annotationType: string | null, hasBets: boolean): boolean {
  return annotationType === AnnotationTypes.Amount && hasBets;
}