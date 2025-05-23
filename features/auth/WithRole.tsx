import React from 'react';
import { useAuth } from '@/shared/context/AuthContext';
import { UserRole } from '@/data/mockData'; // Assuming UserRole is exported from mockData

// Define the props for the WithRole component
interface WithRoleProps {
  children: React.ReactNode;
  role: UserRole; // Use the UserRole type defined in mockData
}

/**
 * A component that renders its children only if the authenticated user's role
 * matches the specified role.
 */
const WithRole: React.FC<WithRoleProps> = ({ children, role }) => {
  // Get the authentication state from the AuthContext
  // Note: Adjust this based on how your AuthContext actually provides the user role.
  // Assuming authState includes a 'user' object with a 'role' property.
  // If useAuth directly returns the user object or role, adjust accordingly.
  const { /* Destructure necessary state from useAuth, e.g., user */ } = useAuth();

  // Placeholder: Replace this with the actual way to get the user's role
  // For example, if useAuth provides a 'user' object:
  // const currentUserRole = user?.role;
  const currentUserRole: UserRole | undefined = undefined; // Replace with actual logic

  // If the current user's role does not match the required role, render nothing
  if (currentUserRole !== role) {
    return null; // Render nothing (or a placeholder/message if preferred)
  }

  // If the roles match, render the children components
  return <>{children}</>;
};

export default WithRole;