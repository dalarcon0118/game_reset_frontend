import { Stack, ErrorBoundary as DefaultErrorBoundary } from "expo-router";
import { routes } from "../../config/routes";
import { BankerDashboardProvider } from "../../features/banker/dashboard/core";
import { FinancialModule } from "../../shared/store/financial/store";

export { DefaultErrorBoundary as ErrorBoundary };

export default function AuthenticatedLayout() {
  return (
    <BankerDashboardProvider>
      <FinancialModule.Provider>
        <Stack>
          <Stack.Screen name="(tabs)" options={routes.banker.tabs.options} />
          <Stack.Screen name="drawers/[id]" options={routes.banker.drawer.options} />
          <Stack.Screen name="reports/form" options={routes.banker.reports_form.options} />
          <Stack.Screen name="rules" options={routes.banker.rules.options} />
          <Stack.Screen name="listerias/[id]" options={routes.banker.listerias.options} />
        </Stack>
      </FinancialModule.Provider>
    </BankerDashboardProvider>
  );
}
