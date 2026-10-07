const http = require('http');

function check(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        console.log(`URL: ${url} -> STATUS: ${res.statusCode} (Length: ${data.length})`);
        if (res.statusCode !== 200) {
          console.log('ERROR EXTRACT:', data.slice(0, 500));
        }
        resolve(res.statusCode);
      });
    }).on('error', (err) => {
      console.error(`ERROR for ${url}:`, err.message);
      resolve(500);
    });
  });
}

async function run() {
  await check('http://localhost:3000/tech');
  await check('http://localhost:3000/tech/job');
}

run();
