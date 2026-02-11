import { User } from '@/data/mock_data';

export interface BackendLoginResponse {
  access: string;
  refresh?: string;
  user: User;
}

export type { User };
