# Ghar Tak Service (GTS) - Native Android Applications

This multi-module Gradle project contains the two native Android Jetpack Compose applications specified in `gts.drawio.pdf`:

1. **Customer App (`:customer-app`)**
   - **Package**: `com.ghartak.customer`
   - **Primary Palette**: Sapphire Blue (`#0D47A1`)
   - **Core Features**: 60-second emergency booking hero banner, electrical service catalog, real-time pincode validation, 18% GST itemization, UPI Intent checkout, real-time SSE technician tracking with vector map route canvas, secure 4-digit handover OTP (`4819`), and service completion sign-off with GST invoice download.

2. **Field Technician Partner App (`:technician-app`)**
   - **Package**: `com.ghartak.technician`
   - **Primary Palette**: Flame Orange (`#E65100`)
   - **Core Features**: Shift duty online/offline toggle, 70% earnings summary card, 60-second emergency dispatch siren alarm, 1000V Class 0 insulated gloves & 0.0V MCB isolation CameraX safety interlock, foreground GPS telemetry tracking service (`TechnicianLocationService`), 50m geofenced doorstep arrival, and 4-digit handover OTP verification with 70/15/15 financial ledger payout settlement.

---

## Workspace Structure

```
android/
├── build.gradle.kts                   # Top-level Gradle build configuration
├── settings.gradle.kts                # Multi-project module declarations (:customer-app, :technician-app)
├── gradle.properties                  # JVM args (-Xmx2048m), AndroidX flags
├── gradlew / gradlew.bat              # Gradle 8.4 wrapper executables
├── gradle/wrapper/
│   ├── gradle-wrapper.jar             # Gradle wrapper jar bootstrap
│   └── gradle-wrapper.properties      # Distribution URL (Gradle 8.4)
├── build_apks.bat                     # Automated Windows build script
├── build_apks.sh                      # Automated Unix / CI build script
├── customer-app/
│   ├── build.gradle.kts               # Jetpack Compose, Retrofit, OkHttp-SSE, Maps dependencies
│   ├── proguard-rules.pro             # Serialization & model keep rules
│   └── src/main/
│       ├── AndroidManifest.xml        # Permissions (Internet, Location, Calls) & Activities
│       ├── res/                       # Adaptive vector launcher icons (Sapphire Blue), themes, strings
│       └── java/com/ghartak/customer/
│           ├── CustomerApplication.kt
│           ├── MainActivity.kt
│           ├── data/                  # ApiClient, CustomerApiService, Models, RealtimeStreamManager, SessionManager
│           └── ui/                    # Auth, Catalog, Booking, Payment, Track, Signoff, Theme
└── technician-app/
    ├── build.gradle.kts               # Jetpack Compose, CameraX, OkHttp-SSE, Location services
    ├── proguard-rules.pro             # Serialization & model keep rules
    └── src/main/
        ├── AndroidManifest.xml        # Foreground Service (location), Camera, Vibrate, WAKE_LOCK
        ├── res/                       # Adaptive vector launcher icons (Flame Orange), themes, strings
        └── java/com/ghartak/technician/
            ├── TechnicianApplication.kt
            ├── MainActivity.kt
            ├── data/                  # ApiClient, TechnicianApiService, Models, RealtimeStreamManager, SessionManager
            ├── service/               # TechnicianLocationService (Foreground GPS stream)
            └── ui/                    # Auth, Dashboard, Dispatch, Safety, Nav, Complete, Theme
```

---

## Prerequisites

- **JDK**: Java Development Kit 17+ (e.g. Eclipse Temurin 17 or Android Studio JBR)
- **Android SDK**: API 34 (Android 14) with Build Tools `34.0.0`
- **Gradle**: 8.4 (bundled via Gradle wrapper)
- **Kotlin**: 1.9.22 with Compose Compiler `1.5.8`

---

## Building the APKs

### Option A: Using the Automated Build Scripts
On Windows:
```cmd
cd android
build_apks.bat
```
Or from the project root:
```cmd
npm run android:build
```

On Linux / macOS:
```bash
cd android
chmod +x ./build_apks.sh ./gradlew
./build_apks.sh
```

### Option B: Using Gradle Wrapper Directly
```cmd
# Clean build
./gradlew clean

# Build Customer App Debug APK
./gradlew :customer-app:assembleDebug

# Build Technician App Debug APK
./gradlew :technician-app:assembleDebug

# Build Both APKs simultaneously
./gradlew assembleDebug
```

---

## Output APK Locations

When compilation finishes, the debug APKs will be available at:
- **Customer App APK**:
  `android/customer-app/build/outputs/apk/debug/customer-app-debug.apk`
- **Technician App APK**:
  `android/technician-app/build/outputs/apk/debug/technician-app-debug.apk`

---

## Backend Connectivity Configuration

By default, both apps connect to:
- **Android Emulator**: `http://10.0.2.2:3000/api/` (routes automatically to `localhost:3000` on your host machine)
- **Physical Device over Wi-Fi**: Call `ApiClient.updateBaseUrl("http://<YOUR_LAN_IP>:3000/api/")` or configure your LAN IP.
- **Production / Cloud Deployment**: Point `ApiClient.baseUrl` to your production HTTPS domain.
