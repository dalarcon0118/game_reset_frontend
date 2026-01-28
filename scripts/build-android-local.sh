#!/bin/bash

# Verificar si Docker está corriendo
if ! docker info > /dev/null 2>&1; then
  echo "❌ Error: Docker no parece estar en ejecución. Por favor, abre Docker Desktop."
  exit 1
fi

echo "🐳 Iniciando contenedor de compilación Docker Lite..."
echo "⚠️ Recuerda haber asignado al menos 5GB de RAM en Docker Desktop -> Settings -> Resources."

# Ejecutar la compilación
docker-compose -f docker-compose.build.yml up --build --abort-on-container-exit

# Verificar resultado
if [ $? -eq 0 ]; then
  echo "🎉 ¡Éxito! Busca tu APK en: android/app/build/outputs/apk/release/"
else
  echo "❌ La compilación falló. Revisa los logs arriba."
fi
