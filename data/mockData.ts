import { BetType, DrawRules, DrawType, FinancialSummary, GameType,FijosCorridosBet,ParletBet, CentenaBet } from '@/types';

export const mockFinancialSummary: FinancialSummary = {
  totalCollected: 250.75,
  premiumsPaid: 85.00,
  netResult: 165.75,
};

export const mockDraws: DrawType[] = [
  {
    id: '1',
    source: 'Florida Mañana',
    date: '25 Dic 2023',
    time: '1:30 PM',
    status: 'open',
  },
  {
    id: '2',
    source: 'NY Noche',
    date: '25 Dic 2023',
    time: '7:00 PM',
    status: 'open',
  },
  {
    id: '3',
    source: 'La Habana Tarde',
    date: '25 Dic 2023',
    time: '3:00 PM',
    status: 'pending',
  },
  {
    id: '4',
    source: 'Venezuela Noche',
    date: '25 Dic 2023',
    time: '8:30 PM',
    status: 'pending',
  },
  {
    id: '5',
    source: 'Miami Mañana',
    date: '26 Dic 2023',
    time: '11:00 AM',
    status: 'open',
  },
];

export const mockRecentBets: BetType[] = [
  {
    id: '1',
    type: 'Fijo',
    numbers: '23',
    amount: 5.00,
    draw: 'Florida Mañana',
    createdAt: '10:15 AM',
  },
  {
    id: '2',
    type: 'Parlet',
    numbers: '15-88',
    amount: 10.00,
    draw: 'NY Noche',
    createdAt: '10:05 AM',
  },
  {
    id: '3',
    type: 'Corrido',
    numbers: '42',
    amount: 3.00,
    draw: 'Florida Mañana',
    createdAt: '9:45 AM',
  },
  {
    id: '4',
    type: 'Fijo',
    numbers: '67',
    amount: 8.00,
    draw: 'La Habana Tarde',
    createdAt: '9:30 AM',
  },
  {
    id: '5',
    type: 'Parlet',
    numbers: '31-74',
    amount: 6.00,
    draw: 'NY Noche',
    createdAt: '9:20 AM',
  },
  {
    id: '6',
    type: 'Fijo',
    numbers: '19',
    amount: 4.00,
    draw: 'Miami Mañana',
    createdAt: '9:10 AM',
  },
];

// Mock data for the dashboard app

// User roles
export type UserRole = 'listero' | 'colector' | 'admin';

// User interface
export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  active: boolean;
  password?: string; // Add optional password field
}

// Mock users data
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'jperez',
    name: 'Juan Pérez',
    role: 'admin',
    active: true,
    password: '123', // Add password
  },
  {
    id: '2',
    username: 'mrodriguez',
    name: 'María Rodríguez',
    role: 'colector',
    active: true,
    password: '123', // Add password
  },
  {
    id: '3',
    username: 'alopez',
    name: 'Antonio López',
    role: 'admin',
    active: true,
    password: '123', // Add password
  },
  {
    id: '4',
    username: 'cgomez',
    name: 'Carmen Gómez',
    role: 'listero',
    active: true,
    password: '123', // Add password
  },
  {
    id: '5',
    username: 'rgarcia',
    name: 'Roberto García',
    role: 'colector',
    active: true,
    password: '123', // Add password
  }
];

// Current user (for demo purposes - might need adjustment based on login logic)
// Consider removing this or setting it dynamically after login
export const currentUser = mockUsers[0];

// Legacy mock data (keeping for backward compatibility)
export const mockListeroName = currentUser.name;

// Mock data for bets
export const mockBets = [
  { id: '1', customer: 'Carlos Mendoza', amount: 50, date: '2023-10-15', status: 'paid' },
  { id: '2', customer: 'Laura Sánchez', amount: 25, date: '2023-10-15', status: 'pending' },
  { id: '3', customer: 'Miguel Torres', amount: 100, date: '2023-10-14', status: 'paid' },
  { id: '4', customer: 'Ana Martínez', amount: 75, date: '2023-10-14', status: 'paid' },
  { id: '5', customer: 'José Rodríguez', amount: 30, date: '2023-10-13', status: 'pending' },
];

// Role descriptions
export const roleDescriptions: Record<UserRole, string> = {
  listero: 'Encargado de registrar apuestas y gestionar clientes',
  colector: 'Encargado de recolectar pagos y gestionar la contabilidad',
  admin: 'Administrador del sistema con acceso completo'
};
// Define interfaces for the bet types


// Mock data based on the image
export const mockFijosCorridos: FijosCorridosBet[] = [
  { id: 'fc1', bet: 47, fijoAmount: 20, corridoAmount: 20 }, // Note: 47 is partially visible
  { id: 'fc2', bet: 57, fijoAmount: 20, corridoAmount: 20 },
  { id: 'fc3', bet: 67, fijoAmount: 20, corridoAmount: 20 },
  { id: 'fc4', bet: 82, fijoAmount: 500, corridoAmount: null },
  { id: 'fc5', bet: 9, fijoAmount: 1200, corridoAmount: null },
  { id: 'fc6', bet: 20, fijoAmount: 1200, corridoAmount: null },
  { id: 'fc7', bet: 99, fijoAmount: 1200, corridoAmount: null },
  { id: 'fc8', bet: 74, fijoAmount: 1100, corridoAmount: null },
  { id: 'fc9', bet: 6, fijoAmount: 1100, corridoAmount: null },
  { id: 'fc10', bet: 59, fijoAmount: 1100, corridoAmount: null },
];

export const mockParlets: ParletBet[] = [
  { id: 'p1', bets: [9, 59, 33], amount: 350 },
  { id: 'p2', bets: [1, 6, 66], amount: 350 },
  { id: 'p3', bets: [22, 86, 93], amount: 360 },
  { id: 'p4', bets: [99, 74], amount: 200 },
  { id: 'p5', bets: [30, 59, 55], amount: 350 },
  { id: 'p6', bets: [27, 72], amount: 100 },
  { id: 'p7', bets: [74, 34], amount: 80 },
  { id: 'p8', bets: [6, 60], amount: 50 },
  { id: 'p9', bets: [6, 60,78], amount: 50 },
];

export const mockCentenas: CentenaBet[] = [
  { id: 'c1', bet: 830, amount: 120 },
  // Add more if needed, only one visible in the image clearly associated with the column
];

export const mockGameTypes: GameType[] = [
  {
    id: '1',
    name: 'Fijo',
    code: 'fijo',
    description: 'Selecciona un número de 2 dígitos',
  },
  {
    id: '2',
    name: 'Parlet',
    code: 'parlet',
    description: 'Selecciona dos o más números de 2 dígitos',
  },
  {
    id: '3',
    name: 'Centena',
    code: 'centena',
    description: 'Selecciona un número de 3 dígitos. Usa X para comodines',
  },
];

export const commonAmounts = [1, 5, 10, 20, 50, 100];


// Datos de ejemplo basados en la imagen proporcionada
export const mockRules: DrawRules[] = [
  {
    drawId: '1', // Florida Mañana
    betLimits: {
      fijo: 2000,
      corrido: 2000,
      parlet: 200,
      centena: 200
    },
    prizesPerDollar: {
      fijo: 75,
      corrido: 25,
      parlet: 1000,
      centena: 400
    },
    limitedPrizesPerDollar: {
      fijo: 50,
      corrido: 20,
      parlet: 500,
      centena: 250
    },
    profitPercentage: {
      fijo: 20,
      corrido: 20,
      parlet: 30,
      centena: 30
    },
    limitedNumbers: {
      day: ['65', '33', '69', '38', '07', '90'],
      night: ['64', '65', '69', '38', '07', '90']
    },
    parletLimits: {
      day: [],
      night: []
    }
  },
  // Reglas para otros sorteos (puedes duplicar y modificar según sea necesario)
  {
    drawId: '2', // NY Noche
    betLimits: {
      fijo: 2000,
      corrido: 2000,
      parlet: 200,
      centena: 200
    },
    prizesPerDollar: {
      fijo: 75,
      corrido: 25,
      parlet: 1000,
      centena: 400
    },
    limitedPrizesPerDollar: {
      fijo: 50,
      corrido: 20,
      parlet: 500,
      centena: 250
    },
    profitPercentage: {
      fijo: 20,
      corrido: 20,
      parlet: 30,
      centena: 30
    },
    limitedNumbers: {
      day: ['65', '33', '69', '38', '07', '90'],
      night: ['64', '65', '69', '38', '07', '90']
    },
    parletLimits: {
      day: [],
      night: []
    }
  },
  // Añadir reglas para los demás sorteos...
];

