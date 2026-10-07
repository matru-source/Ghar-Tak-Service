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
  console.log('🧪 ELECTRICARE VERIFICATION SUITE: STEP 33 & STEP 34 (PHASE 4)');
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
    // Test 1: Verify Customer Booking Page (TASK-033)
    console.log('--- Test Group 1: Service Booking Flow & Slot Selection (TASK-033) ---');
    const bookingsRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/customer/bookings',
      method: 'GET',
    });
    assert(bookingsRes.status === 200, 'Customer Bookings Route HTTP 200', `Status: ${bookingsRes.status}`);
    assert(
      bookingsRes.raw.includes('Service Booking') && bookingsRes.raw.includes('Colaba Hub 400001'),
      'Booking Shell Title & Subtitle Rendered',
      'Contains Service Booking & Slot heading and Colaba Hub reference'
    );

    // Test 2: Verify Service Catalog Integration in Booking Flow
    const servicesRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/services',
      method: 'GET',
    });
    assert(
      servicesRes.status === 200 && Array.isArray(servicesRes.data?.data?.services),
      'Service Catalog Fetch',
      `Found ${servicesRes.data?.data?.services?.length} services available for booking`
    );

    // Test 3: Create Service Booking Order via POST /api/jobs (TASK-033)
    console.log('\n--- Test Group 2: Work Order Creation & Payment Execution (TASK-033) ---');
    const newBookingRes = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/jobs',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        customerId: 'cust_amit_01',
        serviceId: 'srv_fan_01',
        pincode: '400001',
        customerAddressText: 'Flat 402, Sea View Apartments, Colaba, Mumbai 400001 (Vibrating fan bearing)',
        priority: 'STANDARD',
      }
    );
    assert(
      newBookingRes.status === 201 || newBookingRes.status === 200,
      'POST /api/jobs (Booking Order Creation)',
      `Status: ${newBookingRes.status}, Ticket: ${newBookingRes.data?.data?.jobTicketNumber}`
    );
    assert(
      Boolean(newBookingRes.data?.data?.handoverOtp && newBookingRes.data?.data?.handoverOtp.length === 4),
      '4-Digit Handover OTP Generated',
      `OTP: ${newBookingRes.data?.data?.handoverOtp}`
    );
    assert(
      Boolean(newBookingRes.data?.data?.technicianName),
      'Technician Dispatched',
      `Assigned Tech: ${newBookingRes.data?.data?.technicianName}`
    );

    // Test 4: Verify Live GPS Tracking Page (TASK-034 / CUST-SCR-02)
    console.log('\n--- Test Group 3: Live GPS Technician Tracking (TASK-034 / CUST-SCR-02) ---');
    const trackRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/customer/track',
      method: 'GET',
    });
    assert(trackRes.status === 200, 'Customer Track Route HTTP 200', `Status: ${trackRes.status}`);
    assert(
      trackRes.raw.includes('Technician On The Way') && trackRes.raw.includes('Live GPS'),
      'Live Tracking Header Rendered',
      'Contains Technician On The Way and Live GPS badge'
    );
    assert(
      trackRes.raw.includes('Rajesh Kumar') || trackRes.raw.includes('Master Electrician'),
      'Technician Dossier & Avatar Rendered',
      'Contains Rajesh Kumar credentials and ratings'
    );
    assert(
      trackRes.raw.includes('Handover OTP') || trackRes.raw.includes('Start Service'),
      'Handover OTP Security Box Rendered',
      'Contains confidential 4-digit code handover block'
    );

    // Test 5: Verify Active Customer Profile has Live Job Tracking
    const profileRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/customer/profile?customerId=cust_amit_01',
      method: 'GET',
    });
    assert(
      profileRes.status === 200 && profileRes.data?.data?.activeJob,
      'Live Job Telemetry Synchronized',
      `Active Job Ticket: ${profileRes.data?.data?.activeJob?.jobTicketNumber}, Tech: ${profileRes.data?.data?.activeJob?.technician?.fullName}`
    );

    console.log('\n================================================================');
    console.log(`🏁 TEST RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
    console.log('================================================================');
  } catch (err) {
    console.error('Test execution failed:', err);
  }
}

runTests();
