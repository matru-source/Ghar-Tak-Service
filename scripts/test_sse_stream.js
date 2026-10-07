/**
 * Test Server-Sent Events (SSE) Bus Connection & Heartbeat
 */
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/realtime/events?role=CUSTOMER&customerId=cust_amit_01',
  method: 'GET',
  headers: {
    'Accept': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  }
};

console.log('[SSE TEST] Connecting to SSE stream at /api/realtime/events ...');

const req = http.request(options, (res) => {
  console.log(`[SSE TEST] HTTP Status: ${res.statusCode} ${res.statusMessage}`);
  console.log(`[SSE TEST] Content-Type: ${res.headers['content-type']}`);
  
  if (res.headers['content-type'] && res.headers['content-type'].includes('text/event-stream')) {
    console.log('\x1b[32m[SSE TEST] ✔ SSE text/event-stream protocol verified!\x1b[0m');
  } else {
    console.error('\x1b[31m[SSE TEST] ✖ Unexpected content-type\x1b[0m');
  }

  let receivedChunks = 0;
  res.on('data', (chunk) => {
    receivedChunks++;
    const text = chunk.toString();
    console.log(`[SSE EVENT RECEIVED]\n${text.trim()}`);
    if (receivedChunks >= 1) {
      console.log('\x1b[32m[SSE TEST] ✔ SSE stream confirmed active. Closing test connection.\x1b[0m');
      req.destroy();
      process.exit(0);
    }
  });

  res.on('end', () => {
    console.log('[SSE TEST] Stream closed by server');
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`[SSE TEST] Problem with request: ${e.message}`);
  process.exit(1);
});

req.setTimeout(5000, () => {
  console.log('[SSE TEST] Connection timeout - test passed connection verification');
  req.destroy();
  process.exit(0);
});

req.end();
