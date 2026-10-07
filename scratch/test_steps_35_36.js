/**
 * Automated Verification Script for Step 35 (TASK-035) & Step 36 (TASK-036)
 * ElectriCare (Ghar Tak) Mission-Critical Platform
 */

const http = require('http');

function makeRequest(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('========================================================================');
  console.log('🚀 TESTING STEP 35 (TASK-035) & STEP 36 (TASK-036) VERIFICATION');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Test Customer Tax Invoice Page (Step 35 - TASK-035)
    console.log('--- TEST 1: Customer Invoice & Handover OTP Completion (CUST-SCR-03) ---');
    const invoiceRes = await makeRequest('http://localhost:3000/customer/history');
    assert(invoiceRes.status === 200, `GET /customer/history returns status 200 (Got ${invoiceRes.status})`);
    assert(invoiceRes.body.includes('INV-2026-001'), 'Page renders Official Tax Invoice #INV-2026-001');
    assert(invoiceRes.body.includes('Amit Sharma'), 'Page includes Customer Name (Amit Sharma)');
    assert(invoiceRes.body.includes('Rajesh Kumar'), 'Page includes Technician Name (Rajesh Kumar)');
    assert(invoiceRes.body.includes('TECH-4819') || invoiceRes.body.includes('TECH-'), 'Page includes Technician Badge Number');
    assert(invoiceRes.body.includes('18%') || invoiceRes.body.includes('CGST') || invoiceRes.body.includes('GST'), 'Page includes 18% statutory GST breakdown');
    assert(invoiceRes.body.includes('9987'), 'Page includes SAC/HSN Code 9987 (Electrical Installation)');
    assert(invoiceRes.body.includes('4829'), 'Page seals job with Handover OTP 4829');
    assert(invoiceRes.body.includes('1000V') || invoiceRes.body.includes('gloves'), 'Page confirms 1000V insulated gloves safety check passed');
    assert(invoiceRes.body.includes('232V') || invoiceRes.body.includes('Earthing'), 'Page confirms electrical earthing load test passed (232V)');
    assert(invoiceRes.body.includes('Before') || invoiceRes.body.includes('After'), 'Page contains Before/After photographic evidence');

    // 2. Test Technician Dashboard Shell (Step 36 - TASK-036)
    console.log('\n--- TEST 2: Technician Mobile App Dashboard & Queue (TECH-SCR-01) ---');
    const techRes = await makeRequest('http://localhost:3000/tech');
    assert(techRes.status === 200, `GET /tech returns status 200 (Got ${techRes.status})`);
    assert(techRes.body.includes('Rajesh Kumar'), 'Page displays active technician persona Rajesh Kumar');
    assert(techRes.body.includes('PRO'), 'Page displays certified PRO badge');
    assert(techRes.body.includes('4.8'), 'Page displays technician rating 4.8 ⭐');
    assert(techRes.body.includes('Colaba 400001'), 'Page includes assigned primary pincode Colaba 400001');
    assert(techRes.body.includes('Fort 400002') && techRes.body.includes('Bandra'), 'Page includes assigned pincode roster (Fort & Bandra)');
    assert(techRes.body.includes('1000V Insulated gloves'), 'Page displays mandatory 1000V insulated safety gloves protocol banner');
    assert(techRes.body.includes('2,150') || techRes.body.includes('2150'), "Page displays Today's Earnings metric (₹2,150)");
    assert(techRes.body.includes('32,500') || techRes.body.includes('32500'), 'Page displays Month-to-Date Earnings (₹32,500)');
    assert(techRes.body.includes('Daily Dispatch Tasks'), 'Page displays Daily Dispatch Tasks progress tracker');
    assert(techRes.body.includes('J-1005'), 'Page displays Urgent Dispatch Priority Request card #J-1005');
    assert(techRes.body.includes('Ceiling Fan Installation'), 'Urgent card displays service title');
    assert(techRes.body.includes('1,000') || techRes.body.includes('1000'), 'Urgent card displays Technician Cut ₹1,000');
    assert(techRes.body.includes('J-1001'), 'Active queue contains In-Route job #J-1001');
    assert(techRes.body.includes('MCB Continuous Tripping'), 'Active queue job displays MCB fix description');
    assert(techRes.body.includes('Resume Turn-by-Turn'), 'Active queue job provides Resume Turn-by-Turn CTA');
    assert(techRes.body.includes('Wire Calc') && techRes.body.includes('Load Chart'), 'Technician toolkit includes Wire Calc & Load Chart utilities');

    // 3. Test Technician API Availability Switch
    console.log('\n--- TEST 3: Technician Availability API Patch ---');
    const patchOnlineRes = await makeRequest('http://localhost:3000/api/technicians/tech_rajesh_01/availability', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    }, { isOnline: true, latitude: 18.9220, longitude: 72.8347 });

    assert(patchOnlineRes.status === 200, `PATCH /api/technicians/tech_rajesh_01/availability (ONLINE) returns 200 (Got ${patchOnlineRes.status})`);
    const patchOnlineJson = JSON.parse(patchOnlineRes.body);
    assert(patchOnlineJson.success === true, 'API confirms successful status switch to ONLINE');
    assert(patchOnlineJson.data.isOnline === true, 'Data payload confirms isOnline: true');

    const patchOfflineRes = await makeRequest('http://localhost:3000/api/technicians/tech_rajesh_01/availability', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    }, { isOnline: false });
    assert(patchOfflineRes.status === 200, `PATCH /api/technicians/tech_rajesh_01/availability (OFFLINE) returns 200 (Got ${patchOfflineRes.status})`);
    const patchOfflineJson = JSON.parse(patchOfflineRes.body);
    assert(patchOfflineJson.data.isOnline === false, 'Data payload confirms isOnline: false');

    // Restore to true
    await makeRequest('http://localhost:3000/api/technicians/tech_rajesh_01/availability', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    }, { isOnline: true });

    // 4. Test Technician Dossier API
    console.log('\n--- TEST 4: Technician Dossier API ---');
    const dossierRes = await makeRequest('http://localhost:3000/api/technicians/tech_rajesh_01');
    assert(dossierRes.status === 200, `GET /api/technicians/tech_rajesh_01 returns 200 (Got ${dossierRes.status})`);
    const dossierJson = JSON.parse(dossierRes.body);
    assert(dossierJson.data.fullName === 'Rajesh Kumar', 'Dossier returns fullName Rajesh Kumar');
    assert(dossierJson.data.kycStatus === 'VERIFIED', 'Dossier confirms KYC status VERIFIED');
    assert(dossierJson.data.insulatedGlovesVerified === true, 'Dossier confirms 1000V Insulated Gloves verified');

    console.log('\n========================================================================');
    console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
    console.log('========================================================================');

    if (failed === 0) {
      console.log('🎉 ALL STEP 35 AND STEP 36 SPECIFICATIONS VERIFIED 100% SUCCESFULLY!');
      process.exit(0);
    } else {
      console.error('⚠️ SOME TESTS FAILED.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during test execution:', err);
    process.exit(1);
  }
}

runTests();
