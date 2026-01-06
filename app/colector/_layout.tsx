import { Stack, ErrorBoundary } from "expo-router";
import { routes } from "../../config/routes";

export { ErrorBoundary };

export default function AuthenticatedLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={routes.colector.tabs.options} />
      <Stack.Screen name={routes.colector.details.screen} options={routes.colector.details.options} />
      <Stack.Screen name={routes.colector.reports_form.screen} options={routes.colector.reports_form.options} />
      <Stack.Screen name={routes.colector.update_rule.screen} options={routes.colector.update_rule.options} />
      <Stack.Screen name={routes.colector.node_rule.screen} options={routes.colector.node_rule.options} />
    </Stack>
  );
}
