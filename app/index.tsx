import { useEffect } from 'react';
import { logger } from '../shared/utils/logger';
import { ActivityIndicator } from 'react-native';
import { router } from '@/shared/core/router';
export default function Index() {
  useEffect(() => {
    logger.debug('Index page mounted');
    // No need to do anything here, RootLayout handles the redirect
  }, []);


  return <ActivityIndicator style={{ flex: 1 }} />;
}
