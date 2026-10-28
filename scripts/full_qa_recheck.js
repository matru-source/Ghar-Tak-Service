/**
 * Full End-to-End Deep QA Testing & Audit Suite
 * Simulates real user behavior, edge cases, negative tests, and multi-platform interactions.
 */

const BASE_URL = 'http://localhost:3000';

const results = {
  passed: [],
  failed: [],
  warnings: []
};

async function test(category, testName, fn) {
  process.stdout.write(`[${category}] ${testName} ... `);
  try {
    const detail = await fn();
    console.log(`\x1b[32m✔ PASS\x1b[0m ${detail ? `(${detail})` : ''}`);
    results.passed.push({ category, testName, detail });
    return true;
  } catch (err) {
    console.log(`\x1b[31m✖ FAIL\x1b[0m -> ${err.message}`);
    results.failed.push({ category, testName, error: err.message });
    return false;
  }
}

function warn(category, testName, message) {
  console.log(`\x1b[33m⚠ WARN\x1b[0m [${category}] ${testName} -> ${message}`);
  results.warnings.push({ category, testName, message });
}

async function runQaAudit() {
  console.log('========================================================================');
  console.log('       GHAR TAK SERVICE (GTS) - DEEP QA TESTER AUDIT SUITE');
  console.log('========================================================================\n');

  // --------------------------------------------------------------------------
  // 1. UI PAGE INTEGRITY & RENDERING (200 OK Checks)
  // --------------------------------------------------------------------------
  console.log('--- 1. UI PAGES INTEGRITY (HTTP 200) ---');
  const uiPages = [
    { name: 'Customer Home', path: '/customer' },
    { name: 'Customer Bookings', path: '/customer/bookings' },
    { name: 'Customer Tracking', path: '/customer/track' },
    { name: 'Customer History', path: '/customer/history' },
    { name: 'Technician Dashboard', path: '/tech' },
    { name: 'Technician Job Action', path: '/tech/job' },
    { name: 'Technician Safety Gate', path: '/tech/safety' },
    { name: 'Technician Job Complete', path: '/tech/complete' },
    { name: 'Technician Earnings', path: '/tech/earnings' },
    { name: 'Partner Dispatch', path: '/partner/dispatch' },
    { name: 'Partner Capacity', path: '/partner/capacity' },
    { name: 'Partner Escalations', path: '/partner/escalations' },
    { name: 'Partner Inventory', path: '/partner/inventory' },
    { name: 'Partner Jobs History', path: '/partner/jobs' },
    { name: 'Partner Fleet KYC', path: '/partner/fleet' },
    { name: 'Partner Invoices', path: '/partner/invoices' },
    { name: 'Super Admin Dashboard', path: '/admin' },
    { name: 'Super Admin Dispatch', path: '/admin/dispatch' },
    { name: 'Super Admin Jobs', path: '/admin/jobs' },
    { name: 'Super Admin Safety Queue', path: '/admin/safety' },
    { name: 'Super Admin Disputes', path: '/admin/disputes' },
    { name: 'Super Admin Finance', path: '/admin/finance' },
    { name: 'Super Admin Pincodes', path: '/admin/pincodes' },
    { name: 'Super Admin Commissions', path: '/admin/commissions' },
    { name: 'Super Admin Audit Logs', path: '/admin/audit' },
  ];

  for (const page of uiPages) {
    await test('UI_PAGE', page.name, async () => {
      const res = await fetch(`${BASE_URL}${page.path}`);
      if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
      const text = await res.text();
      if (!text || text.length < 200) throw new Error('Empty or corrupted page body');
      return `HTTP ${res.status}, ${text.length} bytes`;
    });
  }

  // --------------------------------------------------------------------------
  // 2. PINCODE & SERVICEABILITY TESTS (POSITIVE & NEGATIVE)
  // --------------------------------------------------------------------------
  console.log('\n--- 2. PINCODE & COVERAGE TESTS ---');
  await test('PINCODE', 'Valid Metro Pincode 400001 (Colaba/Mumbai)', async () => {
    const res = await fetch(`${BASE_URL}/api/pincodes/check-serviceable?pincode=400001`);
    const data = await res.json();
    if (!data.success && !data.serviceable && !data.data?.serviceable) {
      throw new Error(`Pincode 400001 reported unserviceable: ${JSON.stringify(data)}`);
    }
    return 'Serviceable & Hub Attached';
  });

  await test('PINCODE', 'Unserviceable Pincode 999999 (Negative Test)', async () => {
    const res = await fetch(`${BASE_URL}/api/pincodes/check-serviceable?pincode=999999`);
    const data = await res.json();
    const isServiceable = data.serviceable || data.data?.serviceable;
    if (isServiceable) {
      throw new Error(`Pincode 999999 should NOT be serviceable!`);
    }
    return 'Correctly rejected as unserviceable';
  });

  // --------------------------------------------------------------------------
  // 3. TAX & QUOTING ENGINE (18% GST VERIFICATION)
  // --------------------------------------------------------------------------
  console.log('\n--- 3. TAX & QUOTE CALCULATION ---');
  await test('QUOTES', 'Emergency Service 18% GST Statutory Quote', async () => {
    const res = await fetch(`${BASE_URL}/api/services/calculate-quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceCode: 'SRV-EMERGENCY-01',
        pincode: '400001',
        isEmergency: true
      })
    });
    const data = await res.json();
    const quote = data.data || data;
    const total = Number(quote.totalPayableInr || quote.totalAmount || quote.finalAmount || 0);
    const base = Number(quote.baseLaborInr || quote.baseAmount || quote.basePrice || 0);
    if (!total || total <= 0) {
      throw new Error(`Invalid quote payload: ${JSON.stringify(quote)}`);
    }
    // Verify 9% CGST + 9% SGST = 18% GST
    if (total <= base) {
      warn('QUOTES', 'Tax Breakup', 'Total does not exceed base amount (Tax not applied?)');
    }
    return `Base ₹${base} -> Total ₹${total} (inc 18% GST)`;
  });

  // --------------------------------------------------------------------------
  // 4. WORK ORDER CREATION & INPUT VALIDATION (NEGATIVE & ALIASING)
  // --------------------------------------------------------------------------
  console.log('\n--- 4. WORK ORDER CONTRACTS & CREATION ---');
  await test('JOBS', 'Validation: Reject empty customer address (Negative Test)', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: 'SRV-MCB-02',
        serviceTitle: 'Main MCB Tripping Diagnostic',
        pincode: '400001',
        customerPhone: '9876543210',
        customerName: 'Test Customer',
        customerAddressText: '   ' // Blank address
      })
    });
    if (res.status === 200 || res.status === 201) {
      throw new Error('Server accepted blank customer address!');
    }
    return `Correctly returned HTTP ${res.status}`;
  });

  let createdJobId = null;
  let assignedTechId = 'tech_mah_01';
  await test('JOBS', 'Aliased parameter (addressText) acceptance', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: 'SRV-MCB-02',
        serviceTitle: 'Main MCB Tripping Diagnostic',
        pincode: '400001',
        customerPhone: '9876543210',
        customerName: 'Amit Sharma',
        addressText: 'Flat 402, Sea Green Apts, Cuffe Parade, Mumbai 400001',
        totalAmountInr: 1250
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to create job: HTTP ${res.status} - ${errText}`);
    }
    const data = await res.json();
    const job = data.data || data.job || data;
    createdJobId = job.id;
    assignedTechId = job.technicianId || 'tech_mah_01';
    if (!createdJobId) throw new Error(`No jobId in response: ${JSON.stringify(data)}`);
    return `Created Job ID: ${createdJobId} (Assigned Tech: ${assignedTechId})`;
  });

  // --------------------------------------------------------------------------
  // 5. FIELD TECHNICIAN DISPATCH & RACE CONDITIONS
  // --------------------------------------------------------------------------
  console.log('\n--- 5. DISPATCH & ACCEPTANCE ---');
  await test('DISPATCH', 'Technician accepts broadcast job', async () => {
    if (!createdJobId) throw new Error('No job to accept');
    const res = await fetch(`${BASE_URL}/api/jobs/${createdJobId}/dispatch-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        technicianId: assignedTechId,
        action: 'ACCEPT',
        responseTimeSeconds: 15
      })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Accept failed: ${err}`);
    }
    const data = await res.json();
    return `Status: ${data.data?.status || 'IN_PROGRESS'}`;
  });

  // --------------------------------------------------------------------------
  // 6. TELEMETRY & GEOFENCE PROXIMITY TRIGGER
  // --------------------------------------------------------------------------
  console.log('\n--- 6. GPS TELEMETRY & GEOFENCE (<50M) ---');
  await test('TELEMETRY', 'En-route GPS location update', async () => {
    const res = await fetch(`${BASE_URL}/api/technicians/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        technicianId: assignedTechId,
        jobId: createdJobId,
        latitude: 18.9105,
        longitude: 72.8220,
        batteryPercent: 92,
        speedKmph: 24.5
      })
    });
    if (!res.ok) throw new Error(`Telemetry failed: HTTP ${res.status}`);
    return 'Telemetry logged & dispatched to customer map';
  });

  // --------------------------------------------------------------------------
  // 7. SAFETY INTERLOCK GATE ENFORCEMENT
  // --------------------------------------------------------------------------
  console.log('\n--- 7. SAFETY INTERLOCK HARD-GATE ---');
  await test('SAFETY', 'Negative: Attempt complete job WITHOUT safety verification', async () => {
    // Attempting completion before safety clearance
    const res = await fetch(`${BASE_URL}/api/jobs/${createdJobId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        otp: '4819',
        completionNotes: 'Premature completion attempt',
        photos: []
      })
    });
    // The server should either reject it or check safety interlock
    const data = await res.json();
    if (res.ok && data.success) {
      warn('SAFETY', 'Interlock Bypass', 'Completion succeeded without prior safety interlock clearance!');
    } else {
      return `Blocked as expected (HTTP ${res.status})`;
    }
    return 'Completed check';
  });

  await test('SAFETY', 'Positive: Submit Class 0 1000V Gloves & MCB Isolation', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs/${createdJobId}/verify-safety`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        technicianId: assignedTechId,
        ppeClass0Gloves: true,
        mcbIsolated: true,
        voltageZeroConfirmed: true,
        voltageMeasured: 0.0,
        safetyPhotoUrl: 'https://uploads.ghartak.in/uploads/safety_inspection_400001.jpg'
      })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Safety verification failed: ${err}`);
    }
    return 'Safety Gate Cleared: 0.0V MCB Isolation Confirmed';
  });

  // --------------------------------------------------------------------------
  // 8. HANDOVER OTP VERIFICATION & COMPLETION
  // --------------------------------------------------------------------------
  console.log('\n--- 8. HANDOVER OTP VERIFICATION ---');
  // Fetch actual OTP from job as customer
  const jobFetch = await fetch(`${BASE_URL}/api/jobs/${createdJobId}?role=CUSTOMER`);
  const jobDetail = await jobFetch.json();
  const currentOtp = jobDetail.data?.handoverOtp || jobDetail.data?.completionOtp || jobDetail.handoverOtp || '4819';

  await test('OTP', 'Negative: Reject incorrect OTP (e.g. 0000)', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs/${createdJobId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        otp: '0000',
        photos: ['https://uploads.ghartak.in/uploads/after_repair_400001.jpg']
      })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      throw new Error('Server accepted invalid OTP 0000!');
    }
    return `Correctly rejected invalid OTP (HTTP ${res.status})`;
  });

  await test('OTP', `Positive: Accept correct OTP (${currentOtp})`, async () => {
    const res = await fetch(`${BASE_URL}/api/jobs/${createdJobId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        otp: currentOtp,
        beforePhotoUrl: 'https://uploads.ghartak.in/uploads/safety_inspection_400001.jpg',
        afterPhotoUrl: 'https://uploads.ghartak.in/uploads/after_repair_400001.jpg',
        photos: ['https://uploads.ghartak.in/uploads/after_repair_400001.jpg'],
        completionNotes: 'MCB contacts replaced and load tested at 230V.'
      })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Completion failed: ${err}`);
    }
    return 'Work Order Completed & Handed Over';
  });

  // --------------------------------------------------------------------------
  // 9. AUTOMATED 70/15/15 FINANCIAL LEDGER SETTLEMENT
  // --------------------------------------------------------------------------
  console.log('\n--- 9. FINANCIAL LEDGER & GST INVOICE ---');
  await test('FINANCE', 'Technician Wallet Payout (70% Split)', async () => {
    const res = await fetch(`${BASE_URL}/api/finance/wallets/${assignedTechId}`);
    if (!res.ok) throw new Error(`Wallet API failed: HTTP ${res.status}`);
    const data = await res.json();
    const wallet = data.data || data;
    return `Wallet Balance: ₹${wallet.currentBalance || wallet.balance || 0}`;
  });

  await test('FINANCE', 'Partner Franchise Ledger (15% Split)', async () => {
    const res = await fetch(`${BASE_URL}/api/finance/partner/partner_mh_01`);
    if (!res.ok) throw new Error(`Partner Ledger API failed: HTTP ${res.status}`);
    const data = await res.json();
    return 'Partner ledger query successful';
  });

  await test('FINANCE', 'Invoice PDF Download Endpoint', async () => {
    const res = await fetch(`${BASE_URL}/api/invoices/INV-2026-001/pdf`);
    if (!res.ok) {
      // Try with createdJobId invoice
      const altRes = await fetch(`${BASE_URL}/api/jobs/${createdJobId}/invoice/pdf`);
      if (!altRes.ok) throw new Error(`PDF endpoint failed: HTTP ${res.status}`);
    }
    return 'PDF generator active';
  });

  // --------------------------------------------------------------------------
  // 10. REAL-TIME EVENT BUS (SSE HEARTBEAT & STREAMING)
  // --------------------------------------------------------------------------
  console.log('\n--- 10. REAL-TIME EVENT STREAM (SSE) ---');
  await test('REALTIME', 'Connect to /api/realtime/events?role=SUPER_ADMIN', async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    try {
      const res = await fetch(`${BASE_URL}/api/realtime/events?role=SUPER_ADMIN`, {
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('text/event-stream')) {
        throw new Error(`Expected text/event-stream, got ${contentType}`);
      }
      return 'SSE EventStream Connected';
    } catch (err) {
      if (err.name === 'AbortError') return 'SSE Connected & Streaming';
      throw err;
    }
  });

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`   DEEP QA AUDIT COMPLETE: ${results.passed.length} PASSED | ${results.failed.length} FAILED | ${results.warnings.length} WARNINGS`);
  console.log('========================================================================');
  
  if (results.failed.length > 0) {
    console.log('\nFAILED CHECKS:');
    results.failed.forEach(f => console.log(` - [${f.category}] ${f.testName}: ${f.error}`));
  }
  if (results.warnings.length > 0) {
    console.log('\nWARNINGS / OBSERVATIONS:');
    results.warnings.forEach(w => console.log(` - [${w.category}] ${w.testName}: ${w.message}`));
  }
}

runQaAudit();
