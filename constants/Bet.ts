export const GameTypes = {
  FIJO: 'fijo',
  PARLET: 'parlet',
  CENTENA: 'centena',
  CORRIDO: 'corrido',
  FIJOS_CORRIDOS: 'fijos_corridos',
} as const;

export const GameTypeLabels = {
  [GameTypes.FIJO]: 'Fijo',
  [GameTypes.PARLET]: 'Parlet',
  [GameTypes.CENTENA]: 'Centena',
  [GameTypes.CORRIDO]: 'Corrido',
  [GameTypes.FIJOS_CORRIDOS]: 'Fijos y Corridos',
} as const;

export const GameTypeDescriptions = {
  [GameTypes.FIJO]: 'Select a number',
  [GameTypes.PARLET]: 'Select two or more numbers',
  [GameTypes.CENTENA]: 'Select a number',
  [GameTypes.CORRIDO]: 'Select a number',
  [GameTypes.FIJOS_CORRIDOS]: 'Select a number',
} as const;

export const GameTypeLimits = {
  [GameTypes.FIJO]: {
    maxLength: 2,
    minAmount: 1,
    maxAmount: 2000,
  },
  [GameTypes.PARLET]: {
    maxLength: 20, // 10 pairs
    minPairs: 2,
    maxPairs: 10,
    minAmount: 1,
    maxAmount: 200,
  },
  [GameTypes.CENTENA]: {
    maxLength: 3,
    minAmount: 1,
    maxAmount: 200,
  },
  [GameTypes.CORRIDO]: {
    maxLength: 3,
    minAmount: 1,
    maxAmount: 200
  },
  [GameTypes.FIJOS_CORRIDOS]: {
    maxLength: 3,
    minAmount: 1,
    maxAmount: 200
  }
} as const;

export type GameTypeCodes = "fijo" | "parlet" | "centena" | "corrido" | "fijos_corridos"


export const AnnotationTypes = {
  Bet: 'bet',
  Amount: 'amount',
} as const;

export type AnnotationType = 'bet' | 'amount';