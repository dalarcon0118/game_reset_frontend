import * as Linking from 'expo-linking';

export const router = {
  push: (href: string | { pathname: string; params?: Record<string, string> }) => {
    const url = typeof href === 'string' ? href : `${href.pathname}?${new URLSearchParams(href.params as Record<string, string>).toString()}`;
    Linking.openURL(url);
    console.log('[Router] push:', url);
  },
  replace: (href: string) => {
    Linking.openURL(href);
    console.log('[Router] replace:', href);
  },
  back: () => {
    Linking.openURL('/');
    console.log('[Router] back');
  },
};

export const useNavigationContainerRef = () => {
  return {
    current: null,
    navigate: (name: string, params?: Record<string, string>) => {
      const url = params ? `${name}?${new URLSearchParams(params).toString()}` : name;
      Linking.openURL(url);
    },
    goBack: () => {
      Linking.openURL('/');
    },
  };
};