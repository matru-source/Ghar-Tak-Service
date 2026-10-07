/**
 * Automated Verification Script for Step 37 (TASK-037) & Step 38 (TASK-038)
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
  console.log('🚀 TESTING STEP 37 (TASK-037) & STEP 38 (TASK-038) VERIFICATION');
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
    // 1. Test Technician Push Alert & Dispatch Modal (Step 37 - TASK-037)
    console.log('--- TEST 1: New Job Push Alert & Dispatch Modal (TECH-SCR-01) ---');
    const techRes = await makeRequest('http://localhost:3000/tech');
    assert(techRes.status === 200, `GET /tech returns status 200 (Got ${techRes.status})`);
    assert(techRes.body.includes('Simulate Push') || techRes.body.includes('Priority Push'), 'Page features Inbound Push Alert simulation trigger');
    assert(techRes.body.includes('J-1005'), 'Page includes urgent dispatch ticket #J-1005');
    assert(techRes.body.includes('Ceiling Fan Installation'), 'Job alert renders service title (Ceiling Fan Installation)');
    assert(techRes.body.includes('Amit Sharma'), 'Job alert renders customer name (Amit Sharma)');
    assert(techRes.body.includes('1,000') || techRes.body.includes('1000'), 'Job alert displays Technician Payout Cut ₹1,000');
    assert(techRes.body.includes('Colaba') && techRes.body.includes('1.2 km'), 'Job alert renders Colaba location & 1.2 km distance');
    assert(techRes.body.includes('Decline'), 'Modal provides Decline / Reject action');
    assert(techRes.body.includes('Traffic Congestion') || techRes.body.includes('Missing Spares'), 'Modal provides rejection reason categories');
    assert(techRes.body.includes('Accept Job'), 'Modal provides Accept Job CTA');
    assert(techRes.body.includes('/tech/job'), 'Page provides direct link/navigation to Live Job Turn-by-Turn');

    // 2. Test Dispatch Response Backend API
    console.log('\n--- TEST 2: Dispatch Response Backend API Verification ---');
    const acceptRes = await makeRequest('http://localhost:3000/api/jobs/job_sample_urgent_01/dispatch-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      technicianId: 'tech_rajesh_01',
      action: 'ACCEPT',
    });
    assert(acceptRes.status === 200, `POST /api/jobs/.../dispatch-response (ACCEPT) returns 200 (Got ${acceptRes.status})`);
    const acceptJson = JSON.parse(acceptRes.body);
    assert(acceptJson.success === true, 'API confirms successful ACCEPT dispatch response');

    const rejectRes = await makeRequest('http://localhost:3000/api/jobs/job_sample_urgent_01/dispatch-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      technicianId: 'tech_rajesh_01',
      action: 'REJECT',
      rejectionReason: 'Traffic Congestion',
    });
    assert(rejectRes.status === 200, `POST /api/jobs/.../dispatch-response (REJECT) returns 200 (Got ${rejectRes.status})`);
    const rejectJson = JSON.parse(rejectRes.body);
    assert(rejectJson.success === true, 'API confirms successful REJECT dispatch response');

    // 3. Test Active Job Navigation & Turn-by-Turn (Step 38 - TASK-038)
    console.log('\n--- TEST 3: Active Job Details, Turn-by-Turn Navigation & Call Customer (TECH-SCR-02) ---');
    const navRes = await makeRequest('http://localhost:3000/tech/job?id=J-1001');
    assert(navRes.status === 200, `GET /tech/job returns status 200 (Got ${navRes.status})`);
    assert(navRes.body.includes('Live Job Navigation'), 'Page header renders "Live Job Navigation"');
    assert(navRes.body.includes('En Route') || navRes.body.includes('ETA'), 'Page renders En Route status badge with live ETA');
    assert(navRes.body.includes('Shahid Bhagat Singh Rd') || navRes.body.includes('turn right'), 'Page renders Turn-by-Turn GPS direction ribbon');
    assert(navRes.body.includes('Moderate Congestion') || navRes.body.includes('Distance & Traffic'), 'Page renders real-time traffic condition ribbon');
    assert(navRes.body.includes('Amit Sharma'), 'Customer destination card renders customer Amit Sharma');
    assert(navRes.body.includes('Sea Green Apartments') && navRes.body.includes('Flat 402'), 'Customer card renders detailed doorstep address (Flat 402, Sea Green Apartments)');
    assert(navRes.body.includes('Lift') || navRes.body.includes('Elevator'), 'Customer card displays elevator operational badge');
    assert(navRes.body.includes('tel:+919876543213') || navRes.body.includes('9876543213'), 'Page includes direct masked telephone dialer link');
    assert(navRes.body.includes('1,000') || navRes.body.includes('1000'), 'Financial card displays technician net take-home ₹1,000');
    assert(navRes.body.includes('Mandatory') && (navRes.body.includes('OTP') || navRes.body.includes('Gloves')), 'Page enforces mandatory Handshake & Safety Start Protocol');
    assert(navRes.body.includes('balcony') || navRes.body.includes('Spare fan box'), 'Customer notes display entryway instructions');
    assert(navRes.body.includes('I Have Arrived at Doorstep') || navRes.body.includes('arrival-btn'), 'Sticky bottom tray provides doorstep arrival CTA');
    assert(navRes.body.includes('Google Maps'), 'Page provides external Google Maps navigation intent link');
    assert(navRes.body.includes('SOS'), 'Page provides Emergency SOS escalation button');

    console.log('\n========================================================================');
    console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
    console.log('========================================================================');

    if (failed === 0) {
      console.log('🎉 ALL STEP 37 AND STEP 38 SPECIFICATIONS VERIFIED 100% SUCCESFULLY!');
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
