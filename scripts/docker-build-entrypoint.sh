#!/bin/bash
set -e

echo "🚀 Iniciando entorno de compilación Lite (Optimizado para 8GB RAM)..."

# 1. Instalar dependencias del monorepo (usando caché de npm si existe)
echo "📦 Instalando dependencias..."
npm install --prefer-offline --no-audit

# 2. Entrar al directorio de Android
cd frontend/android

# 3. Limpiar compilaciones previas para liberar espacio
echo "🧹 Limpiando artefactos previos..."
chmod +x gradlew
./gradlew clean || true

# 4. Compilar la APK
# Ajustado a 2.5GB (punto dulce para entornos de 8GB RAM host / 6GB Docker)
echo "🏗️ Compilando APK (Release)..."
./gradlew assembleRelease \
  --no-daemon \
  --max-workers=1 \
  -Dorg.gradle.parallel=false \
  -Dorg.gradle.jvmargs="-Xmx2560m -XX:MaxMetaspaceSize=512m -XX:+UseG1GC" \
  -Pandroid.enableParallelJsonDeserialization=false

echo "✅ Compilación finalizada con éxito!"
echo "📂 Tu APK está en: frontend/android/app/build/outputs/apk/release/"
