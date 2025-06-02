import { Stack } from "expo-router";

export default function AuthenticatedLayout() {
    // En una aplicación real, aquí es donde verificarías si el usuario está autenticado.
    // Si no lo está, lo redirigirías a la pantalla de login (`router.replace('/')`).
    // Para este ejemplo, la redirección ocurre en la propia pantalla de login.
  
    return (
      <Stack screenOptions={{ headerShown: false }}>
        {/*
          Este layout no necesita definir rutas específicas,
          ya que están definidas por la estructura de archivos dentro de (authenticated).
          Aplica opciones al navegador de pila que envuelve
          todas las rutas dentro de este grupo.
        */}
      </Stack>
    );
  }
  