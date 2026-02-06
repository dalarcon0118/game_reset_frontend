import { Stack, ErrorBoundary } from "expo-router";
import { routes } from "../../config/routes";

export { ErrorBoundary };

export default function AuthenticatedLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={routes.colector.tabs.options} />
      <Stack.Screen name="details/[id]" options={routes.colector.details.options} />
      <Stack.Screen name="reports/form" options={routes.colector.reports_form.options} />
      <Stack.Screen name="update_rule" options={routes.colector.update_rule.options} />
      <Stack.Screen name="rules" options={routes.colector.node_rule.options} />
    </Stack>
  );
}
