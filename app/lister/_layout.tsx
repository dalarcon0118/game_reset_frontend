import { Stack, usePathname, router } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "@/shared/context/AuthContext";
import { routes } from "@/config/routes";

export default function AuthenticatedLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={routes.lister.tabs.options} />
      <Stack.Screen name="bets_create/[id]" options={routes.lister.bets_create.options} />
      <Stack.Screen name="bets_list/[id]" options={routes.lister.bets_list.options} />
      <Stack.Screen name="bets_rules/[id]" options={routes.lister.bets_rules.options} />
      <Stack.Screen name="rewards/[id]" options={routes.lister.rewards.options} />
    </Stack>
  );
}
  