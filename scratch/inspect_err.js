const http = require('http');

http.get('http://localhost:3000/tech', (res) => {
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    try {
      const jsonStart = body.indexOf('{"props":');
      if (jsonStart !== -1) {
        const jsonEnd = body.indexOf('</script>', jsonStart);
        const json = JSON.parse(body.slice(jsonStart, jsonEnd));
        console.log('STATUS:', res.statusCode);
        console.log('ERROR MESSAGE:\n', json.err?.message || json.pageProps?.error);
        console.log('STACK:\n', json.err?.stack);
      } else {
        console.log('STATUS:', res.statusCode);
        console.log('BODY:', body.slice(0, 1500));
      }
    } catch (e) {
      console.log('RAW BODY:\n', body.slice(0, 2000));
    }
  });
});
