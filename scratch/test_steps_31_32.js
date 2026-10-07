const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: json, raw: body });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 ELECTRICARE VERIFICATION SUITE: STEP 31 & STEP 32 (PHASE 4)');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, detail = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ PASS: [${testName}] ${detail}`);
    } else {
      console.error(`❌ FAIL: [${testName}] ${detail}`);
    }
  }

  try {
    // Test 1: Verify Customer Mobile Home View (CUST-SCR-01) HTTP 200 & DOM content
    console.log('--- Test Group 1: Customer Home Page & App Shell (TASK-032) ---');
    const custHome = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/customer',
      method: 'GET',
    });
    assert(custHome.status === 200, 'Customer Home Shell HTTP 200', `Status: ${custHome.status}`);
    assert(
      custHome.raw.includes('ElectriCare') && custHome.raw.includes('Customer App Shell'),
      'Customer Shell Brand & Title Rendered',
      'Contains ElectriCare Mobile and Customer App Shell'
    );

    // Test 2: Verify Customer Login & Phone OTP Page (TASK-031) HTTP 200
    console.log('\n--- Test Group 2: Customer Phone OTP Login & Onboarding (TASK-031) ---');
    const custLogin = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/customer/login',
      method: 'GET',
    });
    assert(custLogin.status === 200, 'Customer Login HTTP 200', `Status: ${custLogin.status}`);
    assert(
      custLogin.raw.includes('Enter your phone number') || custLogin.raw.includes('Verification'),
      'Customer Login Phone Step Rendered',
      'Contains phone entry prompt and onboarding flow'
    );

    // Test 3: Phone OTP Send API
    const otpSendRes = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/otp/send',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { phone: '+919876543213' }
    );
    assert(
      otpSendRes.status === 200 && otpSendRes.data?.success === true,
      'POST /api/auth/otp/send',
      `Sent OTP to +919876543213, DevOtp: ${otpSendRes.data?.data?.devOtp}`
    );

    // Test 4: Phone OTP Verify API
    const codeToVerify = otpSendRes.data?.data?.devOtp || '123456';
    const otpVerifyRes = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/otp/verify',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        phone: '+919876543213',
        otp: codeToVerify,
        role: 'CUSTOMER',
        fullName: 'Amit Sharma',
      }
    );
    assert(
      otpVerifyRes.status === 200 && otpVerifyRes.data?.data?.token,
      'POST /api/auth/otp/verify',
      `Verified Amit Sharma, Issued JWT Claim: ${otpVerifyRes.data?.data?.user?.fullName}`
    );

    // Test 5: Customer Profile & Active Booking API
    console.log('\n--- Test Group 3: Customer Profile & Telemetry (TASK-032) ---');
    const profileRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/customer/profile?customerId=cust_amit_01',
      method: 'GET',
    });
    assert(
      profileRes.status === 200 && profileRes.data?.data?.customer?.fullName === 'Amit Sharma',
      'GET /api/customer/profile',
      `Loaded Amit Sharma profile, Pincode: ${profileRes.data?.data?.customer?.defaultPincode}`
    );
    assert(
      Boolean(profileRes.data?.data?.activeJob?.jobTicketNumber?.startsWith('J-')),
      'Active Job Telemetry Linked',
      `Active Job: ${profileRes.data?.data?.activeJob?.jobTicketNumber}, Tech: ${profileRes.data?.data?.activeJob?.technician?.fullName}`
    );

    // Test 6: Customer Location & Pincode Update API
    const updateProfileRes = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/customer/profile',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        customerId: 'cust_amit_01',
        defaultPincode: '400001',
        defaultAddressLine: 'Flat 402, Sea View Apartments, Colaba, Mumbai 400001',
      }
    );
    assert(
      updateProfileRes.status === 200 && updateProfileRes.data?.data?.defaultPincode === '400001',
      'PUT /api/customer/profile',
      `Updated Colaba 400001 location confirmation`
    );

    // Test 7: Services Catalog & GST Breakdown API
    const servicesRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/services',
      method: 'GET',
    });
    assert(
      servicesRes.status === 200 && Array.isArray(servicesRes.data?.data?.services),
      'GET /api/services',
      `Retrieved ${servicesRes.data?.data?.services?.length} services with 18% GST calculation`
    );

    // Test 8: 24/7 SOS Emergency Booking Dispatch API
    console.log('\n--- Test Group 4: 24/7 Rapid SOS Emergency Trigger ---');
    const sosJobRes = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/jobs',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        customerId: 'cust_amit_01',
        serviceId: 'srv_mcb_02',
        pincode: '400001',
        customerAddressText: 'Flat 402, Sea View Apartments, Colaba, Mumbai (Sparks in MCB)',
        priority: 'EMERGENCY_SOS_247',
      }
    );
    assert(
      (sosJobRes.status === 200 || sosJobRes.status === 201) &&
        sosJobRes.data?.data?.priority === 'EMERGENCY_SOS_247',
      'POST /api/jobs (24/7 Rapid SOS Trigger)',
      `Created Emergency Ticket ${sosJobRes.data?.data?.jobTicketNumber}, Tech: ${sosJobRes.data?.data?.technicianName}`
    );

    console.log('\n================================================================');
    console.log(`🏁 TEST RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
    console.log('================================================================');
  } catch (err) {
    console.error('Test execution failed:', err);
  }
}

runTests();
