declare module 'expo-router' {
  export const useRouter: () => any;
  export const usePathname: () => string;
  export const useLocalSearchParams: <T extends Record<string, string | string[]> = Record<string, string | string[]>>() => T;
  export const useGlobalSearchParams: <T extends Record<string, string | string[]> = Record<string, string | string[]>>() => T;
  export const Link: any;
  export const Stack: any;
  export const Tabs: any;
  export const Slot: any;
  export const Redirect: any;
}
