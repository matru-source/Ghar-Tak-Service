// ==============================================================================
// ElectriCare Automated Verification: STEP 41 (TECH-SCR-05) & STEP 42 (PTNR-APP-01 ~ 04)
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
  console.log('⚡ Starting Verification Suite for STEP 41 & STEP 42...\n');
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

  // TEST SUITE 1: Step 41 Technician Earnings Ledger (TECH-SCR-05)
  console.log('--- TEST SUITE 1: Step 41 Technician Earnings Ledger (TECH-SCR-05) ---');
  try {
    const res = await request('http://localhost:3000/tech/earnings');
    assert(res.statusCode === 200, 'GET /tech/earnings returns 200 OK');
    assert(res.body.includes('Technician Earnings Ledger'), 'Contains title: Technician Earnings Ledger');
    assert(res.body.includes('Gross Earnings Period'), 'Contains metric: Gross Earnings Period');
    assert(res.body.includes('₹32,500') || res.body.includes('32,500'), 'Contains period gross: ₹32,500');
    assert(res.body.includes('Available Wallet Cash'), 'Contains card: Available Wallet Cash');
    assert(res.body.includes('₹8,450') || res.body.includes('8,450'), 'Contains wallet balance: ₹8,450');
    assert(res.body.includes('Withdraw to Bank Account'), 'Contains action CTA: Withdraw to Bank Account');
    assert(res.body.includes('Level 3 Master Electrician'), 'Contains badge: Level 3 Master Electrician');
    assert(res.body.includes('100% Safety Compliance'), 'Contains checkpoint: 100% Safety Compliance');
    assert(res.body.includes('Earnings Activity'), 'Contains ledger: Earnings Activity');
    assert(res.body.includes('Ceiling Fan Installation'), 'Contains job item: Ceiling Fan Installation');
    assert(res.body.includes('GST Compliant &amp; Auto TDS') || res.body.includes('GST Compliant & Auto TDS'), 'Contains compliance: GST & Auto TDS');
  } catch (err) {
    assert(false, `Failed to load /tech/earnings: ${err.message}`);
  }

  // TEST SUITE 2: Step 42 Partner Command Hub (PTNR-APP-01)
  console.log('\n--- TEST SUITE 2: Step 42 Partner Command Hub (PTNR-APP-01) ---');
  try {
    const res = await request('http://localhost:3000/partner-app');
    assert(res.statusCode === 200, 'GET /partner-app returns 200 OK');
    assert(res.body.includes('Maharashtra Team Hub') || res.body.includes('MH Operations'), 'Contains Hub header: Maharashtra Team');
    assert(res.body.includes('Live &amp; Dispatching') || res.body.includes('Live & Dispatching'), 'Contains status: Live & Dispatching');
    assert(res.body.includes('3 Job Escalations Require Dispatch'), 'Contains escalation alert: 3 Job Escalations Require Dispatch');
    assert(res.body.includes('Operations Overview'), 'Contains section: Operations Overview');
    assert(res.body.includes('284'), 'Contains today jobs metric: 284');
    assert(res.body.includes('Field Engineers'), 'Contains fleet metric: Field Engineers');
    assert(res.body.includes('Territory Pincode Densities'), 'Contains heatmap: Territory Pincode Densities');
    assert(res.body.includes('400001 (Colaba)'), 'Contains primary hub: 400001 (Colaba)');
  } catch (err) {
    assert(false, `Failed to load /partner-app: ${err.message}`);
  }

  // TEST SUITE 3: Step 42 Partner Escalations & Reassign Tech (PTNR-APP-02)
  console.log('\n--- TEST SUITE 3: Step 42 Urgent Escalation & Reassign (PTNR-APP-02) ---');
  try {
    const res = await request('http://localhost:3000/partner-app/escalations?id=J-1005');
    assert(res.statusCode === 200, 'GET /partner-app/escalations returns 200 OK');
    assert(res.body.includes('Job Dispatch Detail'), 'Contains header: Job Dispatch Detail');
    assert(res.body.includes('Priority Escalation Hub'), 'Contains badge: Priority Escalation Hub');
    assert(res.body.includes('AC Isolator &amp; High-Load MCB') || res.body.includes('AC Isolator & High-Load MCB'), 'Contains job reference: AC Isolator & High-Load MCB');
    assert(res.body.includes('Amit Sharma'), 'Contains customer: Amit Sharma');
    assert(res.body.includes('Assign Verified Tech'), 'Contains section: Assign Verified Tech');
    assert(res.body.includes('Pradeep Jadhav'), 'Contains candidate specialist: Pradeep Jadhav');
    assert(res.body.includes('reassign-btn'), 'Contains reassign action button with id "reassign-btn"');
  } catch (err) {
    assert(false, `Failed to load /partner-app/escalations: ${err.message}`);
  }

  // TEST SUITE 4: Step 42 Partner Fleet & KYC Review (PTNR-APP-03)
  console.log('\n--- TEST SUITE 4: Step 42 Fleet Registry & KYC Review (PTNR-APP-03) ---');
  try {
    const res = await request('http://localhost:3000/partner-app/fleet');
    assert(res.statusCode === 200, 'GET /partner-app/fleet returns 200 OK');
    assert(res.body.includes('Fleet &amp; Regulatory KYC') || res.body.includes('Fleet & Regulatory KYC'), 'Contains title: Fleet & Regulatory KYC');
    assert(res.body.includes('Rajesh Kumar'), 'Contains technician: Rajesh Kumar');
    assert(res.body.includes('Sunil Verma'), 'Contains technician: Sunil Verma');
    assert(res.body.includes('Wireman License'), 'Contains regulatory check: Wireman License');
    assert(res.body.includes('1000V Gloves'), 'Contains safety gear check: 1000V Gloves');
    assert(res.body.includes('Inspect KYC Documents'), 'Contains document inspection CTA');
  } catch (err) {
    assert(false, `Failed to load /partner-app/fleet: ${err.message}`);
  }

  // TEST SUITE 5: Step 42 Partner Regional Finance & Payouts (PTNR-APP-04)
  console.log('\n--- TEST SUITE 5: Step 42 Regional Finance & Payouts (PTNR-APP-04) ---');
  try {
    const res = await request('http://localhost:3000/partner-app/finance');
    assert(res.statusCode === 200, 'GET /partner-app/finance returns 200 OK');
    assert(res.body.includes('Regional Finance &amp; Payouts') || res.body.includes('Regional Finance & Payouts'), 'Contains title: Regional Finance & Payouts');
    assert(res.body.includes('Accrued Franchise Share'), 'Contains metric: Accrued Franchise Share');
    assert(res.body.includes('₹63,000') || res.body.includes('63,000'), 'Contains partner royalty: ₹63,000');
    assert(res.body.includes('Axis Bank Corporate A/c'), 'Contains bank destination: Axis Bank Corporate A/c');
    assert(res.body.includes('Request Instant Settlement'), 'Contains action CTA: Request Instant Settlement');
    assert(res.body.includes('Tech Fleet Payout Batch'), 'Contains ledger: Tech Fleet Payout Batch');
  } catch (err) {
    assert(false, `Failed to load /partner-app/finance: ${err.message}`);
  }

  console.log('\n======================================================');
  console.log(`🎯 VERIFICATION RESULTS: ${passed} PASSED / ${failed} FAILED`);
  console.log('======================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
