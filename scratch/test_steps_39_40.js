// ==============================================================================
// ElectriCare Automated Verification: STEP 39 (TECH-SCR-03) & STEP 40 (TECH-SCR-04)
// ==============================================================================

const http = require('http');

function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const reqOptions = {
      hostname: u.hostname,
      port: u.port || 80,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('⚡ Starting Verification Suite for STEP 39 & STEP 40...\n');
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

  // TEST SUITE 1: Step 39 Safety Verification Checklist Screen (TECH-SCR-03)
  console.log('--- TEST SUITE 1: Step 39 Safety Checklist Screen (TECH-SCR-03) ---');
  try {
    const res = await request('http://localhost:3000/tech/safety?id=J-1001');
    assert(res.statusCode === 200, 'GET /tech/safety returns 200 OK');
    assert(res.body.includes('Safety Verification Checklist'), 'Contains page title: Safety Verification Checklist');
    assert(res.body.includes('Mandatory Industrial Protocol'), 'Contains section: Mandatory Industrial Protocol');
    assert(res.body.includes('1000V Insulated Gloves'), 'Contains safety item 1: 1000V Insulated Gloves');
    assert(res.body.includes('AC Voltage Zero-Test'), 'Contains safety item 2: AC Voltage Zero-Test');
    assert(res.body.includes('Main MCB Locked &amp; Tagged') || res.body.includes('Main MCB Locked & Tagged'), 'Contains safety item 3: Main MCB Locked & Tagged');
    assert(res.body.includes('Ground Insulated Rubber Mat'), 'Contains safety item 4: Ground Insulated Rubber Mat');
    assert(res.body.includes('Pre-Work Evidence Capture'), 'Contains Section 3: Pre-Work Evidence Capture');
    assert(res.body.includes('Tamper-Proof Tagged'), 'Contains Tamper-Proof Tagged telemetry badge');
    assert(res.body.includes('Enter Customer Start OTP'), 'Contains Section 1: Customer Start OTP');
    assert(res.body.includes('Verify &amp; Start Work') || res.body.includes('Verify & Start Work'), 'Contains Interlock CTA: Verify & Start Work');
    assert(res.body.includes('SOS'), 'Contains Emergency SOS Button');
  } catch (err) {
    assert(false, `Failed to load /tech/safety: ${err.message}`);
  }

  // TEST SUITE 2: Step 40 Work Completion Execution Screen (TECH-SCR-04)
  console.log('\n--- TEST SUITE 2: Step 40 Work Completion Screen (TECH-SCR-04) ---');
  try {
    const res = await request('http://localhost:3000/tech/complete?id=J-1001');
    assert(res.statusCode === 200, 'GET /tech/complete returns 200 OK');
    assert(res.body.includes('Active Work Order Execution'), 'Contains page title: Active Work Order Execution');
    assert(res.body.includes('WORK IN PROGRESS'), 'Contains live status badge: WORK IN PROGRESS');
    assert(res.body.includes('job-timer'), 'Contains live stopwatch element with id "job-timer"');
    assert(res.body.includes('Execution Milestones'), 'Contains section: Execution Milestones');
    assert(res.body.includes('Proof-of-Work Evidence'), 'Contains section: Proof-of-Work Evidence');
    assert(res.body.includes('AI Vision Verified'), 'Contains AI Vision Verified quality ribbon');
    assert(res.body.includes('Customer Completion Handshake'), 'Contains section: Customer Completion Handshake');
    assert(res.body.includes('OTP Successfully Validated'), 'Contains verified handshake pill: OTP Successfully Validated');
    assert(res.body.includes('Earnings Summary'), 'Contains section: Earnings Summary');
    assert(res.body.includes('+₹1,000') || res.body.includes('1,000'), 'Contains technician net payout: +₹1,000');
    assert(res.body.includes('Submit Job Completion &amp; Claim') || res.body.includes('Submit Job Completion & Claim'), 'Contains final completion CTA button');
  } catch (err) {
    assert(false, `Failed to load /tech/complete: ${err.message}`);
  }

  // TEST SUITE 3: Backend Safety Interlock API (POST /api/jobs/[id]/verify-safety)
  console.log('\n--- TEST SUITE 3: Safety Interlock API (POST /api/jobs/[id]/verify-safety) ---');
  try {
    // Missing gloves
    const failRes = await request('http://localhost:3000/api/jobs/job_1001/verify-safety', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      safetyGlovesConfirmed: false,
      safetyMcbSwitchConfirmed: true,
      beforePhotoUrl: '/uploads/jobs/J1001_before.jpg',
    });
    assert(failRes.statusCode === 422, 'Rejects safety interlock when 1000V gloves not confirmed (422)');

    // Missing MCB switch
    const failRes2 = await request('http://localhost:3000/api/jobs/job_1001/verify-safety', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      safetyGlovesConfirmed: true,
      safetyMcbSwitchConfirmed: false,
      beforePhotoUrl: '/uploads/jobs/J1001_before.jpg',
    });
    assert(failRes2.statusCode === 422, 'Rejects safety interlock when MCB switch not confirmed (422)');

    // Valid safety check
    const successRes = await request('http://localhost:3000/api/jobs/job_1001/verify-safety', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      safetyGlovesConfirmed: true,
      safetyMcbSwitchConfirmed: true,
      beforePhotoUrl: '/uploads/jobs/J1001_before.jpg',
    });
    assert(successRes.statusCode === 200, 'Confirms safety interlock with gloves + MCB + before photo (200)');
    const parsed = JSON.parse(successRes.body);
    assert(parsed.data.status === 'SAFETY_CHECKED', 'Job status updated to SAFETY_CHECKED');
  } catch (err) {
    assert(false, `Failed safety API test: ${err.message}`);
  }

  // TEST SUITE 4: Backend Work Completion Handover API (POST /api/jobs/[id]/complete)
  console.log('\n--- TEST SUITE 4: Work Completion Handover API (POST /api/jobs/[id]/complete) ---');
  try {
    // Missing or invalid OTP
    const invalidOtpRes = await request('http://localhost:3000/api/jobs/job_1001/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      handoverOtp: '9999',
      afterPhotoUrl: '/uploads/jobs/J1001_after.jpg',
    });
    assert(invalidOtpRes.statusCode === 400, 'Rejects handover with mismatched OTP 9999 (400)');

    // Successful handover with valid OTP (4829)
    const completeRes = await request('http://localhost:3000/api/jobs/job_1001/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      handoverOtp: '4829',
      afterPhotoUrl: '/uploads/jobs/J1001_after.jpg',
      customerRating: 5,
      customerFeedback: 'Zero Wobble, Clean Wiring, Polite Tech',
    });
    assert(completeRes.statusCode === 200, 'Accepts completion with valid OTP 4829 & after photo (200)');
    const compData = JSON.parse(completeRes.body);
    assert(compData.data.job.status === 'WORK_COMPLETED', 'Job status transitioned to WORK_COMPLETED');
    assert(compData.data.invoice && compData.data.invoice.invoiceNumber, `Generated Indian GST Tax Invoice: ${compData.data.invoice?.invoiceNumber}`);
    assert(compData.data.completionSummary.totalAmountInr === 1250, 'Invoice total matches ₹1,250');
  } catch (err) {
    assert(false, `Failed complete API test: ${err.message}`);
  }

  console.log('\n======================================================');
  console.log(`🎯 VERIFICATION RESULTS: ${passed} PASSED / ${failed} FAILED`);
  console.log('======================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
