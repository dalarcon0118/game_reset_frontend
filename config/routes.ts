import { UserRole } from '@/data/mockData';

export const roleToScreenMap: Record<UserRole | string, string > = {
  admin: '(admin)',
  listero: "lister",
  colector: 'colector',
  banker: 'banker',
};