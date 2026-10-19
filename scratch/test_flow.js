// Comprehensive E2E Flow Simulation & Verification Test
const http = require('http');

async function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('   GHAR TAK END-TO-END FLOW AUDIT & TEST SUITE      ');
  console.log('====================================================\n');

  const findings = [];

  // TEST 1: Register New Technician in Odisha (pincode 760001)
  console.log('--- TEST 1: Technician Registration (Rajiv in Odisha: 760001) ---');
  const regPayload = {
    id: 'tech_rajiv_od_99',
    fullName: 'Rajiv Pradhan',
    phone: '+919876543299',
    email: 'rajiv@ghartak.test',
    trade: '1000V Certified Senior Electrician',
    pincode: '760001',
    badgeNumber: 'GTS-TECH-9901'
  };
  const regRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/technicians',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, regPayload);
  console.log('Status:', regRes.status, '| Success:', regRes.body?.success, '| Name:', regRes.body?.data?.fullName);
  if (regRes.status !== 201) findings.push('Technician registration failed with status ' + regRes.status);

  // TEST 2: Customer searches for Technicians with PIN 760001
  console.log('\n--- TEST 2: Customer Searches Technicians in Pincode 760001 ---');
  const searchRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/technicians?pincode=760001&isOnline=true',
    method: 'GET'
  });
  console.log('Status:', searchRes.status, '| Count:', searchRes.body?.data?.summary?.totalCount);
  const foundRajiv = searchRes.body?.data?.technicians?.find(t => t.id === 'tech_rajiv_od_99');
  console.log('Found newly registered Rajiv?:', !!foundRajiv);
  const mumbaiTechs = searchRes.body?.data?.technicians?.filter(t => t.assignedPincode?.startsWith('40'));
  console.log('Are Mumbai technicians leaking into 760001?:', mumbaiTechs?.length || 0);
  if (!foundRajiv) findings.push('Newly registered technician not found in pincode search');
  if (mumbaiTechs && mumbaiTechs.length > 0) findings.push('Mumbai technicians leaked into Odisha pincode search');

  // TEST 3: Customer searches in unserved Pincode 600001 (Tamil Nadu)
  console.log('\n--- TEST 3: Customer Searches in Unserved Territory (PIN 600001) ---');
  const emptyRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/technicians?pincode=600001&isOnline=true',
    method: 'GET'
  });
  console.log('Status:', emptyRes.status, '| Count:', emptyRes.body?.data?.summary?.totalCount);
  if (emptyRes.body?.data?.summary?.totalCount > 0) {
    findings.push('Unserved pincode 600001 returned fallback technicians from other states');
  }

  // TEST 4: Customer Creates a Job in 760001
  console.log('\n--- TEST 4: Customer Creates Booking in 760001 assigned to Rajiv ---');
  const jobPayload = {
    customerId: 'cust_user_4491',
    customerName: 'Priyanka Dash',
    customerPhone: '+919437012345',
    serviceId: 'srv_fan_install',
    serviceTitle: 'Ceiling Fan Installation & Isolation',
    basePriceInr: 299.0,
    pincode: '760001',
    customerAddressText: 'Gandhi Nagar, Main Road, Brahmapur, Odisha',
    customerLatitude: 19.3175,
    customerLongitude: 84.7960,
    technicianId: 'tech_rajiv_od_99',
    priority: 'STANDARD'
  };
  const jobRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/jobs',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, jobPayload);
  const createdJob = jobRes.body?.data;
  console.log('Status:', jobRes.status, '| Ticket:', createdJob?.jobTicketNumber, '| Status:', createdJob?.status, '| OTP:', createdJob?.handoverOtp);
  if (!createdJob || jobRes.status !== 201) findings.push('Job creation failed');

  // TEST 5: Technician polls for Inbound Dispatches
  console.log('\n--- TEST 5: Technician Polls Assigned Jobs (GET /api/jobs?technicianId=...) ---');
  const techJobsRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/jobs?technicianId=tech_rajiv_od_99`,
    method: 'GET'
  });
  console.log('Status:', techJobsRes.status, '| Jobs count:', techJobsRes.body?.data?.jobs?.length);
  const alertJob = techJobsRes.body?.data?.jobs?.find(j => j.id === createdJob?.id);
  console.log('Found created job for technician alert?:', !!alertJob);
  if (!alertJob) findings.push('Technician job polling did not receive the created job');

  // TEST 6: Technician Responds to Dispatch (ACCEPT)
  console.log('\n--- TEST 6: Technician Accepts Dispatch (60s timer action) ---');
  const acceptRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/jobs/${createdJob?.id}/dispatch-response`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    action: 'ACCEPT',
    technicianId: 'tech_rajiv_od_99'
  });
  console.log('Status:', acceptRes.status, '| Updated Job Status:', acceptRes.body?.data?.status);
  if (acceptRes.status !== 200 || acceptRes.body?.data?.status !== 'EN_ROUTE') {
    findings.push('Technician accept did not transition job to EN_ROUTE');
  }

  // TEST 7: Technician Sends GPS Telemetry Ping
  console.log('\n--- TEST 7: Technician Sends GPS Telemetry (Lat: 19.3250, Lng: 84.8020) ---');
  const telemRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/technicians/telemetry',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    technicianId: 'tech_rajiv_od_99',
    jobId: createdJob?.id,
    latitude: 19.3250,
    longitude: 84.8020,
    heading: 180.0,
    speedKmh: 24.0,
    batteryLevelPct: 92,
    isOnline: true
  });
  console.log('Status:', telemRes.status, '| Remaining Dist:', telemRes.body?.data?.distanceRemainingKm, 'km | ETA:', telemRes.body?.data?.etaMinutes, 'mins');
  if (telemRes.status !== 200 || !telemRes.body?.data?.distanceRemainingKm) {
    findings.push('GPS Telemetry failed or distance calculation missing');
  }

  // TEST 8: Customer Live Tracking Query (GET /api/technicians/telemetry?jobId=...)
  console.log('\n--- TEST 8: Customer Live Tracking Query ---');
  const liveRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/technicians/telemetry?jobId=${createdJob?.id}`,
    method: 'GET'
  });
  console.log('Status:', liveRes.status, '| Live Status:', liveRes.body?.data?.status, '| Tech Distance:', liveRes.body?.data?.technician?.distanceKm, 'km');
  if (liveRes.status !== 200 || !liveRes.body?.data?.technician) {
    findings.push('Customer live tracking endpoint failed');
  }

  // TEST 9: Geofence Doorstep Arrival (Technician approaches < 50m)
  console.log('\n--- TEST 9: Doorstep Arrival Geofence (< 50m: Lat 19.3176, Lng 84.7961) ---');
  const geofenceRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/technicians/telemetry',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    technicianId: 'tech_rajiv_od_99',
    jobId: createdJob?.id,
    latitude: 19.31752,
    longitude: 84.79602,
    heading: 180.0,
    speedKmh: 2.0,
    batteryLevelPct: 90,
    isOnline: true
  });
  console.log('Status:', geofenceRes.status, '| Dist:', geofenceRes.body?.data?.distanceRemainingKm, 'km | Doorstep Nearby?:', geofenceRes.body?.data?.isDoorstepNearby, '| Updated Status:', geofenceRes.body?.data?.updatedStatus);
  if (!geofenceRes.body?.data?.isDoorstepNearby || geofenceRes.body?.data?.updatedStatus !== 'ARRIVED') {
    findings.push('Geofence doorstep arrival did not automatically trigger ARRIVED status');
  }

  // TEST 10: 1000V High Voltage Safety Interlock Checklist
  console.log('\n--- TEST 10: 1000V High Voltage Safety Interlock ---');
  const safetyRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/jobs/${createdJob?.id}/verify-safety`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    insulatedGlovesConfirmed: true,
    mcbSwitchedOff: true,
    safetyGlovesSerial: 'VDE-1000V-OD-9901',
    voltageReadingVolts: 0.0
  });
  console.log('Status:', safetyRes.status, '| Updated Status:', safetyRes.body?.data?.status);
  if (safetyRes.status !== 200 || (safetyRes.body?.data?.status !== 'SAFETY_CHECKED' && safetyRes.body?.data?.status !== 'IN_PROGRESS')) {
    findings.push('Safety checklist verification failed');
  }

  // TEST 11: Job Completion with Handover OTP
  console.log('\n--- TEST 11: Job Completion with Handover OTP ---');
  console.log('Testing WRONG OTP: 0000');
  const wrongOtpRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/jobs/${createdJob?.id}/complete`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    handoverOtp: '0000'
  });
  console.log('Wrong OTP Status (Expected 400):', wrongOtpRes.status, '| Message:', wrongOtpRes.body?.error || wrongOtpRes.body?.message);
  if (wrongOtpRes.status !== 400) findings.push('Job completed despite WRONG OTP');

  console.log('Testing CORRECT OTP:', createdJob?.handoverOtp);
  const correctOtpRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/jobs/${createdJob?.id}/complete`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    handoverOtp: createdJob?.handoverOtp
  });
  console.log('Correct OTP Status:', correctOtpRes.status, '| Final Job Status:', correctOtpRes.body?.data?.status);
  if (correctOtpRes.status !== 200 || (correctOtpRes.body?.data?.status !== 'WORK_COMPLETED' && correctOtpRes.body?.data?.status !== 'COMPLETED')) {
    findings.push('Job completion with correct OTP failed');
  }

  console.log('\n====================================================');
  console.log('TEST SUMMARY RESULTS:');
  console.log('Total Findings / Gaps Detected:', findings.length);
  if (findings.length === 0) {
    console.log('ALL 11 END-TO-END FLOW TESTS PASSED FLAWLESSLY WITH ZERO GAPS!');
  } else {
    findings.forEach((f, i) => console.log(`${i + 1}. [FAIL] ${f}`));
  }
  console.log('====================================================\n');
}

runTests().catch(console.error);
