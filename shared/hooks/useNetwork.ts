import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export const useNetwork = () => {
  const [isOnline, setIsOnline] = useState<boolean | null>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(state.isConnected && state.isInternetReachable !== false);
    });

    return () => unsubscribe();
  }, []);

  return { isOnline };
};
