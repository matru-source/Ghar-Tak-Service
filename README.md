# Ghar-Tak-Service (GTS)

Enterprise on-demand electrical services SaaS platform complying with the `gts.drawio.pdf` architecture.

## Architecture Overview

The system consists of 4 distinct operational surfaces synchronized via a central Server-Sent Events (SSE) bus:

1. **Super Admin Web Portal** (`admin.localhost:3000` / `/admin`)
   - **Color**: Royal Purple (`#4A148C`)
   - Enterprise governance, multi-tenant partner commission configurations, WORM audit logging, emergency overrides.

2. **Regional Partner Web Portal** (`partner.localhost:3000` / `/partner`)
   - **Color**: Forest Emerald (`#1B5E20`)
   - Regional capacity, field technician KYC verification, SLA escalation sweeps, 15% franchise commission ledger.

3. **Field Technician Android App** (`com.ghartak.technician`)
   - **Color**: Flame Orange (`#E65100`)
   - Shift duty toggle, 70% earnings summary card, 60s emergency siren alarm with vibration, 1000V Class 0 insulated gloves & 0.0V MCB isolation safety interlock (CameraX), foreground GPS telemetry tracking service (`TechnicianLocationService`), 50m geofence doorstep arrival, 4-digit handover OTP verification (`4819`).

4. **Customer Android App** (`com.ghartak.customer`)
   - **Color**: Sapphire Blue (`#0D47A1`)
   - 60-second emergency booking hero banner, electrical catalog, serviceable pincode checker (`400001`), transparent 18% GST itemization, UPI Intent checkout, real-time vector route GPS tracking via SSE bus, secure 4-digit handover OTP display (`4819`), and service sign-off with GST invoice download.

---

## Automated Android APK Generation (GitHub Actions)

This repository includes a GitHub Actions workflow in [`.github/workflows/build_apk.yml`](.github/workflows/build_apk.yml) that automatically builds the debug APKs on every push:
- **Customer App Debug APK**: `customer-app-debug.apk`
- **Technician App Debug APK**: `technician-app-debug.apk`

Go to the **Actions** tab on GitHub, select the latest build, and download the compiled APKs directly from Artifacts!

---

## Local Development & Quick Start

### Web Application & Central API Engine
```bash
# Install dependencies
npm install

# Start local server (port 3000)
npm run dev

# Run 7-stage end-to-end acceptance test
npm run test:e2e

# Test live SSE heartbeat
npm run test:sse
```

### Native Android Apps
```bash
# Windows automated build runner
npm run android:build
# Or navigate to android folder
cd android && build_apks.bat
```
Output APKs:
- `android/customer-app/build/outputs/apk/debug/customer-app-debug.apk`
- `android/technician-app/build/outputs/apk/debug/technician-app-debug.apk`
