const http = require('http');

function postJson(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, text: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      {
        hostname: 'localhost',
        port: 3000,
        path,
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, text: body });
          }
        });
      }
    );
    req.on('error', reject);
  });
}

async function runTest() {
  console.log('--- 1. Register Odisha Technician ---');
  const regTech = await postJson('/api/technicians', {
    fullName: 'Rajiv Mohapatra',
    phone: '+91 94371 99999',
    city: 'Brahmapur',
    assignedPincode: '760001',
    isOnline: true,
    totalExperienceYears: 6,
    licenseNumber: 'OD/ELEC/2026/8899',
    kycStatus: 'VERIFIED',
    insulatedGlovesVerified: true,
    rating: 4.95,
  });
  const techId = regTech.data.data.id;
  console.log('Technician created:', techId);

  console.log('\n--- 2. Customer creates booking in 760001 ---');
  const createJob = await postJson('/api/jobs', {
    customerId: 'cust_odisha_01',
    customerName: 'Sasmita Sahoo',
    customerPhone: '+91 98610 11223',
    serviceId: 'srv_fan_install',
    pincode: '760001',
    technicianId: techId,
    customerAddressText: 'Hillpatna, Near Bus Stand, Brahmapur',
    customerLatitude: 19.315,
    customerLongitude: 84.7941,
    priority: 'EMERGENCY_60S',
    paymentMethod: 'UPI_COLLECT',
  });
  const jobId = createJob.data.data.id;
  const realOtp = createJob.data.data.handoverOtp;
  console.log('Job created:', jobId, 'Real OTP:', realOtp);

  console.log('\n--- 3. Technician accepts dispatch ---');
  const acceptRes = await postJson(`/api/jobs/${jobId}/dispatch-response`, {
    technicianId: techId,
    action: 'ACCEPT',
  });
  console.log('Dispatch acceptance response status:', acceptRes.data.data.status);
  if (acceptRes.data.data.status !== 'EN_ROUTE') {
    throw new Error('Expected EN_ROUTE but got ' + acceptRes.data.data.status);
  }

  console.log('\n--- 4. Technician sends GPS telemetry en route (> 50m) ---');
  const telemEnRoute = await postJson('/api/technicians/telemetry', {
    technicianId: techId,
    jobId: jobId,
    latitude: 19.325,
    longitude: 84.805,
    speedKmh: 24.0,
    heading: 180,
    batteryLevelPct: 90,
    isOnline: true,
  });
  console.log('En route telem status:', telemEnRoute.data.data.updatedStatus);

  console.log('\n--- 5. Technician arrives at doorstep (< 50m geofence) ---');
  const telemArrived = await postJson('/api/technicians/telemetry', {
    technicianId: techId,
    jobId: jobId,
    latitude: 19.31502,
    longitude: 84.79412,
    speedKmh: 0.0,
    heading: 180,
    batteryLevelPct: 89,
    isOnline: true,
  });
  console.log('Doorstep geofence status:', telemArrived.data.data.updatedStatus);
  console.log('isDoorstepNearby:', telemArrived.data.data.isDoorstepNearby);
  if (telemArrived.data.data.updatedStatus !== 'ARRIVED') {
    throw new Error('Expected ARRIVED but got ' + telemArrived.data.data.updatedStatus);
  }

  console.log('\n--- 6. Customer live telemetry query check ---');
  const custQuery = await getJson(`/api/technicians/telemetry?jobId=${jobId}`);
  console.log('Customer sees status:', custQuery.data.data.status);
  console.log('Customer sees handoverOtp:', custQuery.data.data.handoverOtp);
  if (custQuery.data.data.handoverOtp !== realOtp) {
    throw new Error('Mismatch in handoverOtp returned to customer');
  }

  console.log('\n--- 7. Safety Interlock Pass ---');
  const safetyRes = await postJson(`/api/jobs/${jobId}/verify-safety`, {
    jobId: jobId,
    safetyGlovesConfirmed: true,
    safetyMcbSwitchConfirmed: true,
    ppeLevelAchieved: 'LEVEL_3_1000V',
    beforePhotoUrl: 'https://storage.ghartak.in/evidence/mcb_open.jpg',
    afterPhotoUrl: 'https://storage.ghartak.in/evidence/mcb_isolated.jpg',
  });
  console.log('Safety pass status:', safetyRes.data.data?.status || safetyRes.data.data?.job?.status);

  console.log('\n--- 8. Test 4819 Bypass Rejection (Must FAIL if not real OTP) ---');
  const fakeOtpAttempt = await postJson(`/api/jobs/${jobId}/complete`, {
    handoverOtp: '4819',
    afterPhotoUrl: 'https://storage.ghartak.in/evidence/restored.jpg',
  });
  console.log('Fake OTP (4819) HTTP response code:', fakeOtpAttempt.status);
  if (realOtp !== '4819' && fakeOtpAttempt.status === 200) {
    throw new Error('FAIL: 4819 bypass succeeded when real OTP was ' + realOtp);
  } else {
    console.log('PASS: Fake OTP correctly rejected!');
  }

  console.log('\n--- 9. Complete with REAL OTP ---');
  const realOtpAttempt = await postJson(`/api/jobs/${jobId}/complete`, {
    handoverOtp: realOtp,
    afterPhotoUrl: 'https://storage.ghartak.in/evidence/restored.jpg',
  });
  console.log('Real OTP completion response status:', realOtpAttempt.data.data.status);
  if (realOtpAttempt.data.data.status !== 'COMPLETED') {
    throw new Error('Expected COMPLETED but got ' + realOtpAttempt.data.data.status);
  }

  console.log('\nALL 9 FLOW TESTS PASSED FLAWLESSLY!');
}

runTest().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
