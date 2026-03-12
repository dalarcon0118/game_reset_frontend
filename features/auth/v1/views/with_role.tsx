import React from 'react';
import { useAuthV1 } from '../hooks/use_auth';

interface WithRoleProps {
  children: React.ReactNode;
  role: string;
}

/**
 * WithRole Component (v1)
 * Renderiza sus hijos solo si el rol del usuario autenticado coincide.
 * Basado en la arquitectura TEA v1.
 */
export const WithRole: React.FC<WithRoleProps> = ({ children, role }) => {
  const { hasRole, isAuthenticated } = useAuthV1();

  // Si no está autenticado o el rol no coincide, no renderizamos nada
  if (!isAuthenticated || !hasRole(role)) {
    return null;
  }

  return <>{children}</>;
};

export default WithRole;
