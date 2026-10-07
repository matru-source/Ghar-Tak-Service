#!/usr/bin/env bash
set -e

echo "========================================================"
echo "  GHAR TAK SERVICE (GTS) - ANDROID APK BUILD RUNNER"
echo "========================================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Ensure gradlew has executable permissions
chmod +x ./gradlew || true

echo "[1/3] Cleaning previous builds..."
./gradlew clean --no-daemon

echo ""
echo "[2/3] Building Customer App APK (Sapphire Blue #0D47A1)..."
./gradlew :customer-app:assembleDebug --no-daemon

echo ""
echo "[3/3] Building Field Technician App APK (Flame Orange #E65100)..."
./gradlew :technician-app:assembleDebug --no-daemon

echo ""
echo "========================================================"
echo "  SUCCESS! BOTH NATIVE ANDROID APKS ASSEMBLED:"
echo "========================================================"
echo "Customer APK:"
echo "  $SCRIPT_DIR/customer-app/build/outputs/apk/debug/customer-app-debug.apk"
echo ""
echo "Technician APK:"
echo "  $SCRIPT_DIR/technician-app/build/outputs/apk/debug/technician-app-debug.apk"
echo "========================================================"
