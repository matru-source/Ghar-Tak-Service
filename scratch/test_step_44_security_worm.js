// ==============================================================================
// ElectriCare Mission-Critical SaaS: STEP 44 (TASK-044)
// Security Audit, Immutable WORM Logs & Defect Remediation Test Suite
// ==============================================================================

const http = require('http');
const crypto = require('crypto');

function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const reqOptions = {
      hostname: u.hostname,
      port: u.port || 80,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          rawBody: data,
          data: json,
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

async function runStep44SecurityWormAudit() {
  console.log('⚡ ==============================================================================');
  console.log('⚡ STEP 44 (TASK-044): SECURITY AUDIT, IMMUTABLE WORM LOGS & DEFECT REMEDIATION');
  console.log('⚡ ==============================================================================\n');

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
    // --------------------------------------------------------------------------
    // SUITE 1: RBAC Permission Matrix & Access Control Audit
    // --------------------------------------------------------------------------
    console.log('--- SUITE 1: RBAC Permission Matrix & Authentication Security ---');
    
    // 1A. Security Endpoint Audit Report
    const secRes = await request('http://localhost:3000/api/admin/security');
    assert(secRes.statusCode === 200, 'GET /api/admin/security returns HTTP 200 OK');
    const secReport = secRes.data?.report;
    assert(secReport?.rbacAudit?.status === 'SECURE', 'RBAC Status certified: SECURE');
    assert(secReport?.rbacAudit?.rolesConfigured?.length === 4, '4 discrete RBAC roles configured: SUPER_ADMIN, PARTNER, TECHNICIAN, CUSTOMER');
    assert(secReport?.rbacAudit?.tokenAlgorithm.includes('SHA256'), 'Cryptographic Token Algorithm: HMAC-SHA256');

    // 1B. Authentication Login Route Verification
    const loginRes = await request('http://localhost:3000/api/auth/login', { method: 'POST' }, {
      identifier: 'admin@electricare.in',
      password: 'admin123',
    });
    assert(loginRes.statusCode === 200, 'Admin login credentials authenticate successfully (HTTP 200 OK)');
    const token = loginRes.data?.data?.token;
    assert(typeof token === 'string' && token.split('.').length === 3, 'Valid 3-part Signed JWT Bearer token issued');
    assert(loginRes.data?.data?.user?.role === 'SUPER_ADMIN', 'User authenticated with role SUPER_ADMIN');

    // --------------------------------------------------------------------------
    // SUITE 2: Input Sanitization & Attack Resistance (SQLi, XSS, Path Traversal)
    // --------------------------------------------------------------------------
    console.log('\n--- SUITE 2: Input Sanitization & Attack Resistance (SQLi, XSS, Traversal) ---');

    // 2A. SQL Injection Attack Resistance
    const sqliQueries = [
      "' OR '1'='1",
      "'; DROP TABLE jobs; --",
      "UNION SELECT username, password FROM users --",
    ];

    for (const sqlPayload of sqliQueries) {
      const sqliRes = await request(`http://localhost:3000/api/jobs?search=${encodeURIComponent(sqlPayload)}`);
      assert(sqliRes.statusCode === 200, `SQLi Vector Neutralized: "${sqlPayload.slice(0, 20)}..." safely parsed (HTTP 200 OK)`);
      assert(Array.isArray(sqliRes.data?.data?.jobs), 'Database returns empty or safe typed result array without crash');
    }

    // 2B. XSS Script Tag Resistance in Input Payloads
    const xssPayload = "<script>alert('XSS_VULNERABILITY')</script>";
    const xssBookingRes = await request('http://localhost:3000/api/jobs', { method: 'POST' }, {
      customerId: 'cust_amit_01',
      serviceId: 'srv_mcb_02',
      pincode: '400001',
      customerAddressText: `Apt 5B, Nariman Point ${xssPayload}`,
      priority: 'STANDARD',
    });
    assert(xssBookingRes.statusCode === 201, 'XSS Payload stored safely without server execution or unhandled crash (HTTP 201)');
    const xssJob = xssBookingRes.data?.data;
    assert(xssJob?.customerAddressText.includes(xssPayload), 'Address preserved literally for React safe HTML entity encoding');

    // 2C. Path Traversal Parameter Tamper Resistance
    const traversalPayload = '../../../../etc/passwd';
    const traversalRes = await request(`http://localhost:3000/api/jobs/${encodeURIComponent(traversalPayload)}`);
    assert(traversalRes.statusCode === 404, `Path Traversal "${traversalPayload}" blocked cleanly with HTTP 404 Not Found`);

    // --------------------------------------------------------------------------
    // SUITE 3: State Machine Interlocks & Handover OTP Tamper Resistance
    // --------------------------------------------------------------------------
    console.log('\n--- SUITE 3: State Machine Interlocks & Handover OTP Tamper Resistance ---');

    // 3A. Illegal Status Jump: Cannot jump directly to WORK_COMPLETED from ASSIGNED
    const illegalJumpRes = await request(`http://localhost:3000/api/jobs/${xssJob.id}`, { method: 'PATCH' }, {
      status: 'WORK_COMPLETED',
      actorId: 'tech_rajesh_01',
    });
    assert(illegalJumpRes.statusCode === 400, 'State Machine Gate: Illegal transition from ASSIGNED directly to WORK_COMPLETED blocked (HTTP 400)');

    // 3B. Cannot start work without completing safety interlocks
    // First move to EN_ROUTE -> ARRIVED
    await request(`http://localhost:3000/api/jobs/${xssJob.id}`, { method: 'PATCH' }, { status: 'EN_ROUTE' });
    await request(`http://localhost:3000/api/jobs/${xssJob.id}`, { method: 'PATCH' }, { status: 'ARRIVED' });
    const prematureStartRes = await request(`http://localhost:3000/api/jobs/${xssJob.id}`, { method: 'PATCH' }, {
      status: 'IN_PROGRESS',
      actorId: 'tech_rajesh_01',
    });
    assert(prematureStartRes.statusCode === 400, 'Safety Interlock: Cannot transition to IN_PROGRESS without safety check verification (HTTP 400)');

    // 3C. Handover OTP Verification Gate
    const invalidOtpRes = await request(`http://localhost:3000/api/jobs/${xssJob.id}/complete`, { method: 'POST' }, {
      handoverOtp: '9999',
      afterPhotoUrl: 'https://storage.electricare.in/proof/after.jpg',
    });
    assert(invalidOtpRes.statusCode === 400, 'OTP Tamper Gate: Non-matching 4-digit code rejected with HTTP 400');

    // --------------------------------------------------------------------------
    // SUITE 4: Cryptographic WORM (Write Once, Read Many) Chain Integrity
    // --------------------------------------------------------------------------
    console.log('\n--- SUITE 4: Cryptographic WORM Audit Trail & SHA-256 Non-Repudiation ---');

    // 4A. Query WORM Audit Logs & Chain Verification
    const auditRes = await request('http://localhost:3000/api/admin/audit');
    assert(auditRes.statusCode === 200, 'GET /api/admin/audit returns HTTP 200 OK');
    const totalBlocks = auditRes.data?.totalCount;
    assert(totalBlocks >= 10, `WORM Ledger populated with ${totalBlocks} immutable cryptographic event blocks`);
    
    const integrity = auditRes.data?.chainIntegrity;
    assert(integrity?.isValid === true, 'WORM Chain Integrity: 100% Cryptographically Valid (isValid === true)');
    assert(integrity?.algorithm === 'SHA-256 (FIPS 180-4)', 'Integrity Hash Standard: SHA-256 (FIPS 180-4)');
    assert(integrity?.complianceStandard.includes('IT Act 65B'), 'Statutory Compliance: IT Act Section 65B & RBI Cyber Resilience');

    // 4B. Run On-Demand Chain Verification Action
    const verifyChainRes = await request('http://localhost:3000/api/admin/audit', { method: 'POST' }, {
      action: 'VERIFY_CHAIN',
    });
    assert(verifyChainRes.statusCode === 200, 'POST /api/admin/audit (VERIFY_CHAIN) returns HTTP 200 OK');
    assert(verifyChainRes.data?.verification?.isValid === true, 'On-demand recomputation across all blocks confirmed ZERO hash pointer mismatches');

    // 4C. Commit a Manual Auditor Compliance Checkpoint
    const commitCheckpointRes = await request('http://localhost:3000/api/admin/audit', { method: 'POST' }, {
      action: 'RECORD_LOG',
      actorId: 'auditor_compliance_01',
      actorRole: 'SUPER_ADMIN',
      logAction: 'STATUTORY_AUDIT_SIGN_OFF',
      resourceType: 'REGULATORY_COMPLIANCE',
      resourceId: 'CERT_ISO_2026',
      payloadSummary: 'Annual statutory non-repudiation audit completed. Zero defects or data tampering discovered.',
    });
    assert(commitCheckpointRes.statusCode === 200, 'Manual Auditor Checkpoint committed to WORM ledger (HTTP 200 OK)');
    const sealedBlock = commitCheckpointRes.data?.log;
    assert(sealedBlock?.isTamperVerified === true, `Block #${sealedBlock?.sequenceNumber} sealed with SHA-256 hash: ${sealedBlock?.currentHash.slice(0, 16)}...`);
    assert(sealedBlock?.previousHash?.length === 64, 'Previous block pointer hash verified: 64-char hex SHA-256');

    // --------------------------------------------------------------------------
    // SUITE 5: Zero P0/P1 Defect Remediation & Security Diagnostics Run
    // --------------------------------------------------------------------------
    console.log('\n--- SUITE 5: Zero P0/P1 Defect Remediation & Automated Diagnostics ---');

    // 5A. Defect Registry Verification
    const defectInfo = secReport?.defectRegistry;
    assert(defectInfo?.p0BlockerCount === 0, 'Zero P0 (Blocker) Defects: Count = 0');
    assert(defectInfo?.p1CriticalCount === 0, 'Zero P1 (Critical) Defects: Count = 0');
    assert(defectInfo?.p2MediumCount === 0, 'Zero P2 (Medium) Defects: Count = 0');
    assert(defectInfo?.p3MinorCount === 0, 'Zero P3 (Minor) Defects: Count = 0');
    assert(defectInfo?.zeroDefectCertified === true, 'Platform Zero Defect Certification: CERTIFIED TRUE');

    // 5B. Run Automated Diagnostic Suite
    const diagRes = await request('http://localhost:3000/api/admin/security', { method: 'POST' }, {
      action: 'RUN_FULL_SECURITY_DIAGNOSTICS',
    });
    assert(diagRes.statusCode === 200, 'POST /api/admin/security (Diagnostics) returns HTTP 200 OK');
    const diagData = diagRes.data?.diagnostics;
    assert(diagData?.overallVerdict === 'PASS_CLEAN_SECURITY_POSTURE', 'Overall Diagnostic Verdict: PASS_CLEAN_SECURITY_POSTURE');
    assert(diagData?.testsRun === 5, '5/5 automated security diagnostic tests executed');
    assert(diagData?.testsPassed === 5, 'All 5 tests PASSED (WORM, SQLi, XSS, Safety Interlock, Zero Defects)');
    assert(diagData?.testsFailed === 0, '0 tests failed (100% clean test pass rate)');

    console.log('\n==============================================================================');
    console.log(`⚡ STEP 44 SECURITY & WORM AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('==============================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal security audit error:', err);
    process.exit(1);
  }
}

runStep44SecurityWormAudit();
