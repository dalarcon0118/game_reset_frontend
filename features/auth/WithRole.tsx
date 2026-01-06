import React from 'react';
import { useAuth } from './hooks/useAuth';
import { UserRole } from '../../data/mockData';

interface WithRoleProps {
  children: React.ReactNode;
  role: UserRole;
}

/**
 * A component that renders its children only if the authenticated user's role
 * matches the specified role. Uses TEA-based auth state management.
 */
const WithRole: React.FC<WithRoleProps> = ({ children, role }) => {
  const { hasRole } = useAuth();

  // If the current user's role does not match the required role, render nothing
  if (!hasRole(role)) {
    return null;
  }

  // If the roles match, render the children components
  return <>{children}</>;
};

export default WithRole;
