# Ghar Tak Service (GTS) — Client Acceptance & UAT Testing Procedure

**Pan-India Multi-Tenant On-Demand Electrical & Home Services SaaS Platform**  
*Comprehensive End-to-End Walkthrough Guide for Stakeholders, QA Leads & Acceptance Board*

---

## 1. Quick Access Credentials & Live URLs

The platform operates across **4 distinct multi-tenant roles**. You can test via web simulation links on desktop/laptop or install the Android mobile APKs on physical mobile devices.

| Role | Portal / Application | Live Web Simulation URL | Mobile APK Download | Default Login Phone / Email | OTP / Password |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **👑 Role 1** | **Super Admin Command Console** | [https://gts.saralgroups.com/admin](https://gts.saralgroups.com/admin) | — | `admin@ghartak.in` | Demo 1-Click / Configured |
| **🏢 Role 2** | **Regional Partner Hub** | [https://gts.saralgroups.com/partner](https://gts.saralgroups.com/partner) | — | `operations@ghartak.in` | Demo 1-Click / `+919876543211` |
| **🔧 Role 3** | **Field Technician Mobile App** | [https://gts.saralgroups.com/tech](https://gts.saralgroups.com/tech) | `GharTak-Technician-APK` | `+91 98765 43212` | OTP: `1234` |
| **👤 Role 4** | **Customer Mobile App** | [https://gts.saralgroups.com/customer](https://gts.saralgroups.com/customer) | `GharTak-Service-APK` | `+91 98765 43220` | OTP: `1234` |
| **⚡ Gateway** | **Instant 1-Click UAT Switcher** | [https://gts.saralgroups.com/uat](https://gts.saralgroups.com/uat) | — | *Pre-authorized 1-Click Switcher* | *Zero login friction* |

> 💡 **Tip:** Visiting **`https://gts.saralgroups.com/uat`** provides 4 one-click launcher buttons that automatically authenticate and open dedicated sessions for each role in separate tabs.

---

## 2. Option: Resetting to a Clean Slate (0 Data)

If you wish to test the platform **completely from scratch** (starting with 0 partners, 0 technicians, 0 customers, and 0 work orders):

1. Open **`https://gts.saralgroups.com/admin/settings`** as Super Admin.
2. Scroll to the bottom to the red card: **"Clean-Slate Reset & Fresh E2E Testing Engine"**.
3. Click **"Purge Test Data & Reset to Clean State"** and confirm.
4. All test data will be wiped clean. Only the master Super Admin console and service catalog will remain active.

---

## 3. Step-by-Step E2E Testing Procedure

For the best live testing experience, open **two side-by-side browser windows** (or use your PC for Admin/Partner and your Android phones with the APKs for Technician and Customer).

```
┌─────────────────────────────────┐      ┌─────────────────────────────────┐
│     OPERATIONAL DESKS (PC)      │  vs  │       MOBILE APPS (PHONE)       │
│  Super Admin + Partner Hub      │      │  Field Technician + Customer    │
└─────────────────────────────────┘      └─────────────────────────────────┘
```

---

### Step 1: Super Admin Console Inspection & Partner Setup
*URL: `https://gts.saralgroups.com/admin`*

1. **Operations Overview (`/admin`):** Review national dispatch telemetry, GMV metrics, and statutory GST escrow reserve balances.
2. **Franchise Partner Onboarding (`/admin/partners`):**
   - Click **"+ Onboard Regional Partner"**.
   - Enter Entity Name (*e.g., Maharashtra Operations Hub*), Director Name (*e.g., Suresh Patil*), Phone, and State (*Maharashtra*).
   - Allocate territory pincode: **`400001`** (Colaba Hub).
   - Click **"Submit Onboarding Dossier"**.
3. **Pincode Zones (`/admin/pincodes`):** Click on Pincode `400001` to view the GeoJSON territorial polygon and spatial GPS boundary.
4. **Commissions Matrix (`/admin/commissions`):** Verify the automated revenue split formula:
   - **70.0% Technician Net Payout**
   - **15.0% Regional Franchise Partner Commission**
   - **15.0% National Platform Royalty Fee**
   - **18.0% Indian GST Withholding (SAC 9987)**

---

### Step 2: Regional Partner Hub Fleet Onboarding
*URL: `https://gts.saralgroups.com/partner`*

1. **Operations Dashboard (`/partner`):** View territory KPIs, active wiremen count, and settled revenue.
2. **Onboard Field Technician (`/partner/fleet`):**
   - Click **"+ Add Technician"**.
   - Name: *Rajesh Kumar* | Phone: `+91 98765 43212` | Primary Trade: *Electrical*.
   - Assigned Territory Pincode: **`400001`**.
   - Enter Wireman License ID: *EL-MH-2024-8849*.
   - Click **"Submit Registration"**.
3. **Approve KYC:**
   - In the Fleet table, click **"Review KYC"** on the new technician.
   - Click **"Approve & Verify KYC"** to license the technician for active dispatch.
4. **Capacity & Surge (`/partner/capacity`):** Select Pincode `400001` and verify the target ETA (15 mins) and technician quota.

---

### Step 3: Technician Goes on Active Duty
*URL: `https://gts.saralgroups.com/tech` (or open Technician Android APK)*

1. Log in with the technician's phone number (`+91 98765 43212`) and verify with OTP `1234`.
2. At the top of the screen, flip the duty switch to **"Online (Duty Active)"**.
3. The technician is now stationed in Pincode `400001` and actively listening on the live event stream for incoming dispatch sirens.

---

### Step 4: Customer Places an On-Demand Booking
*URL: `https://gts.saralgroups.com/customer` (or open Customer Android APK)*

1. Log in with customer phone number (`+91 98765 43220`) and verify with OTP `1234`.
2. Confirm your location pincode is **`400001`**.
3. Select **"Ceiling Fan Installation / Bearing Replacement"**.
4. Confirm premise address (*Colaba, Mumbai*).
5. Review the transparent Indian GST calculation:
   - **Base Labor:** ₹1,059.32
   - **CGST (9%):** ₹95.34
   - **SGST (9%):** ₹95.34
   - **Total Payable:** **₹1,250.00**
6. Click **"Confirm & Book Doorstep Specialist"**.

---

### Step 5: Real-Time Live Lifecycle Execution (Watch the Synchronization)

Watch all screens update simultaneously without manual page reloads:

#### 1. Instant 60-Second Dispatch Siren Alert
- **Technician Mobile:** An audible siren sounds and a **60-second acceptance modal** pops up showing customer address and technician earnings (₹875.00).
- **Partner & Admin Dispatch Desks:** The work order appears instantly in the live dispatch radar.

#### 2. Technician Accepts Work Order
- Technician taps **"Accept Job (60s SLA)"**.
- **Customer Mobile:** Instantly transitions to **"Technician Assigned & En Route"**, displaying the technician's photo, verified badge, and live GPS radar.

#### 3. Doorstep Arrival & Geofence Handshake
- Technician taps **"Navigate to Job"** -> Click **"Arrived at Doorstep"**.
- **Customer Mobile:** Step tracker auto-advances to **"Technician Arrived at Doorstep"**.

#### 4. Pre-Work Safety Gate (1000V Protocol)
- Technician taps **"Begin Safety Protocol"** (`/tech/safety`):
  - Confirms **1000V Insulated Gloves** deployed.
  - Confirms **MCB Main Switch Isolation**.
  - Captures pre-work inspection photo.
  - Taps **"Verify & Commence Work"**.
- **Customer Mobile:** Tracker advances to **"Safety Verified — Work In Progress"**.

#### 5. Optional: In-Flight Spare Parts Quotation
- Technician taps **"Add Spare Part"** -> Selects *3.15uF Heavy-Duty Capacitor (₹250)* -> Submits quote.
- **Customer Mobile:** An **"In-Flight Scope Expansion Quote"** modal appears with SKU and price breakdown. Customer taps **"Accept Quote"** -> Total bill dynamically updates with itemized GST.

#### 6. Customer 4-Digit Handover OTP & Job Completion
- When work is finished, the **Customer mobile displays a unique 4-digit Handover OTP** (e.g., `5821`).
- The technician captures the post-repair proof photo and enters the customer's 4-digit OTP.
- Technician taps **"Verify OTP & Complete Handover"**.

#### 7. Instant Settlement & Multi-Tenant Reconciliation
- **Technician Mobile:** Celebration modal appears! **70% net commission (₹875.00)** is instantly credited to their wallet balance (`/tech/earnings`).
- **Customer Mobile:** Receives official **18% GST Tax Invoice** (SAC 9987, CGST, SGST) with an instant **"Download Official Tax Invoice PDF"** button.
- **Partner Invoices (`/partner/invoices`):** 15% franchise commission is recorded in the ledger.
- **Super Admin Treasury (`/admin/finance`):** Double-entry escrow reconciles platform fees and GST reserves.
- **WORM Audit Ledger (`/admin/audit`):** A tamper-evident SHA-256 cryptographic block is permanently sealed.

---

## 4. Key Verification Checklist for UAT Sign-Off

| Feature / Gate | Verified Standard | Status |
| :--- | :--- | :--- |
| **Zero Mock / Hardcoded Data** | All data queried and persisted dynamically in database. | ✅ Pass |
| **Real-Time SSE Event Bus** | Watchdog heartbeat normalized; sub-second cross-role synchronization. | ✅ Pass |
| **60-Second Acceptance SLA** | Audible siren modal with auto-rejection timer. | ✅ Pass |
| **1000V Electrical Safety Interlock** | Pre-work checklist & photo evidence enforced before work starts. | ✅ Pass |
| **Customer Handover OTP** | Strict 4-digit customer-generated OTP required for completion. | ✅ Pass |
| **Double-Entry Escrow Reconciliation** | Atomic 70/15/15 split + 18% GST calculation (SAC 9987). | ✅ Pass |
| **Official GST Tax Invoice PDF** | PDF generated dynamically with valid tax breakup and QR code. | ✅ Pass |
| **WORM SHA-256 Ledger** | Cryptographic block chaining compliant with IT Act 65B. | ✅ Pass |
| **Cross-Platform Mobile APKs** | Native Android APKs compiled via GitHub Actions pipelines. | ✅ Pass |

---
*Ghar Tak Service (GTS) Platform Architecture — Formally Certified for Production Delivery & Commercial Launch.*
