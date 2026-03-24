import { Stack } from "expo-router";
import { routes } from "../../config/routes";
import { BankerDashboardStoreProvider } from "../../features/banker/dashboard/core";
import { FinancialModule } from "../../shared/store/financial/store";

export default function AuthenticatedLayout() {
  return (
    <BankerDashboardStoreProvider>
      <FinancialModule.Provider>
        <Stack>
          <Stack.Screen name="(tabs)" options={routes.banker.tabs.options} />
          <Stack.Screen name="drawers/[id]" options={routes.banker.drawer.options} />
          <Stack.Screen name="reports/form" options={routes.banker.reports_form.options} />
          <Stack.Screen name="listerias/[id]" options={routes.banker.listerias.options} />
        </Stack>
      </FinancialModule.Provider>
    </BankerDashboardStoreProvider>
  );
}
