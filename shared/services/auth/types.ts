export interface UserStructure {
  id: number;
  name: string;
  type: string;
  path: string;
  role_in_structure: string;
  commission_rate?: number;
}

export interface User {
  id: string | number;
  username: string;
  name: string;
  email: string;
  role: string; // Usamos string para permitir flexibilidad si se añaden nuevos roles
  active: boolean;
  password?: string; // Opcional, generalmente no se devuelve en respuestas de API
  structure?: UserStructure;
}

export interface BackendLoginResponse {
  access: string;
  refresh?: string;
  user: User;
}
