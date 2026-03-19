/**
 * @deprecated Use useGlobalNetwork from './use_global_network' instead.
 * This hook is maintained only for backward compatibility during the migration to SSoT.
 */
import { useGlobalNetwork } from './use_global_network';

export const useNetwork = () => {
  const { isOnline } = useGlobalNetwork();
  return { isOnline };
};
