import { Stack, usePathname, router } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "@/shared/context/AuthContext";


export default function AuthenticatedLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading]);

  return (
    <Stack >
      
    </Stack>
  );
}
  