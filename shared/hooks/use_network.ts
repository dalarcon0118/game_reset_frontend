import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { isServerReachable } from '../utils/network';

export const useNetwork = () => {
  const [isOnline, setIsOnline] = useState<boolean | null>(true);

  useEffect(() => {
    const checkConnection = async (state: NetInfoState) => {
      if (state.isConnected) {
        // Si hay conexión básica, verificamos si el servidor es alcanzable
        // Esto resuelve el problema de isInternetReachable en entornos locales
        const reachable = await isServerReachable();
        setIsOnline(reachable);
      } else {
        setIsOnline(false);
      }
    };

    // Suscribirse a cambios
    const unsubscribe = NetInfo.addEventListener((state) => {
      checkConnection(state);
    });

    // Verificación inicial
    NetInfo.fetch().then(checkConnection);

    return () => unsubscribe();
  }, []);

  return { isOnline };
};
