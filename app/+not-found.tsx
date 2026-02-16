import { Link, Stack, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('NOT_FOUND');

export default function NotFoundScreen() {
  const pathname = usePathname(); // Get the current route path

  // Log the route path whenever it changes
  useEffect(() => {
    log.debug('Current Route (Not Found)', { pathname });
  }, [pathname]);
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.text}>This screen doesn't exist.</Text>
        <Link href="/" style={styles.link}>
          <Text>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    fontSize: 20,
    fontWeight: 600,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
